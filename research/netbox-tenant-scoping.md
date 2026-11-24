# Scoping Portal Users to their Customer's Tenant via the NetBox API

Resolves [#2](https://github.com/Its-Akimbro/akimbo-website/issues/2). Researched 2026-11-24 against NetBox Community **v4.7.6**, the release current that day. Sources are the NetBox docs and source at commit `4cfaa8f` on `netbox-community/netbox` `main`, plus NetBox GitHub issues. Links to source files point at `main`.

## Answer

**Recommended: give each Customer its own NetBox service account with view-only object permissions constrained to that Customer's Tenant. The Client Portal uses that Customer's token for each request and also filters by tenant in the app as a second check.**

- In NetBox, create one non-superuser account per Customer, e.g. `portal-acme`, with no usable password. Put it in one NetBox Group per Customer.
- Give that group a small set of **view-only** ObjectPermissions. Each constraint uses the Customer's **tenant ID** and follows the model's path to the tenant (see [Constraint shapes](#constraint-shapes-by-object-type)).
- Give each account one **v2 token** with `write_enabled = false`, `allowed_ips` set to the portal server's address, and an `expires` date that is rotated.
- The portal maps Portal User → Customer → token on the server. The token never reaches the browser. Each NetBox call uses only the token of the signed-in Portal User's Customer.
- As a second check, the portal still sends `tenant_id=<id>` where a filter exists. It drops and logs any returned object whose `tenant` is not the Customer's.

A single all-seeing service token with tenant filtering in the app is **not recommended as the only control**. NetBox silently ignores unknown filter parameters and returns the whole table. One missed or misspelled filter would therefore show every Customer's data (see [Failure modes](#failure-modes-that-could-leak-another-customers-data)).

REST and GraphQL both enforce these permissions. GraphQL also restricts nested related objects. REST shows a brief view of related objects without checking permissions. Either can work, but each has caveats below.

## How the NetBox 4.x permission model works

- **Object-based permissions.** An ObjectPermission ties together object types, users and/or groups, actions (`view`/`add`/`change`/`delete` plus custom ones), and optional **constraints**. Constraints are a JSON Django query filter. Keys in one object are ANDed. A list of objects is ORed, and `__` traverses relations. ([docs/administration/permissions.md](https://github.com/netbox-community/netbox/blob/main/docs/administration/permissions.md))
- **Multiple permissions are ORed.** "Where multiple permissions have been assigned for an object type, their collective constraints will be merged using a logical OR." (same doc)
- **One unconstrained permission grants everything.** In `qs_filter_from_constraints()`, a null or empty constraint returns `Q()`, which means access to the whole model ("Found null constraint; permit model-level access"). ([netbox/utilities/permissions.py](https://github.com/netbox-community/netbox/blob/main/netbox/utilities/permissions.py))
- **Superusers and exempt models bypass every check.** `RestrictedQuerySet.restrict()` returns the queryset unfiltered if the user is an active superuser or the permission is exempt (`EXEMPT_VIEW_PERMISSIONS`). ([netbox/utilities/querysets.py](https://github.com/netbox-community/netbox/blob/main/netbox/utilities/querysets.py))
- **`$user` is the only token.** It "cannot be modified or extended to reference specific user attributes". So there is no `tenant = $user.tenant`. Each Customer needs its own permissions with its tenant ID written into the constraint. ([permissions.md, "User Token"](https://github.com/netbox-community/netbox/blob/main/docs/administration/permissions.md))
- **A constraint must be valid for every object type in the permission.** The ObjectPermission form runs the constraint against each selected model and rejects `FieldError`s. Object types with different paths to the tenant need separate permissions. ([netbox/users/forms/model_forms.py](https://github.com/netbox-community/netbox/blob/main/netbox/users/forms/model_forms.py), `ObjectPermissionForm.clean`)
- **`DEFAULT_PERMISSIONS` apply to every authenticated user,** whatever the database permissions say. By default they only let users manage their own tokens. ([docs/configuration/security.md](https://github.com/netbox-community/netbox/blob/main/docs/configuration/security.md#default_permissions))
- **REST enforcement covers the top-level queryset only.** `BaseViewSet.initial()` calls `self.queryset.restrict(request.user, action)`. ([netbox/netbox/api/viewsets/\_\_init\_\_.py](https://github.com/netbox-community/netbox/blob/main/netbox/netbox/api/viewsets/__init__.py)) The REST serializers do not restrict nested objects (see failure mode 4).
- **GraphQL enforces permissions on every type, including relations.** `BaseObjectType.get_queryset()` calls `restrict(user, 'view')` ([netbox/netbox/graphql/types.py](https://github.com/netbox-community/netbox/blob/main/netbox/netbox/graphql/types.py)). Since v4.0.11 this also applies to related objects ([#17310](https://github.com/netbox-community/netbox/issues/17310), release notes `version-4.0.md`). Because of this, to-one relations are always prefetched through the restricted queryset ([#22884](https://github.com/netbox-community/netbox/issues/22884)). GraphQL uses the same tokens as REST ([docs/integrations/graphql-api.md](https://github.com/netbox-community/netbox/blob/main/docs/integrations/graphql-api.md)).

### Tokens (v4.5+)

From [docs/integrations/rest-api.md, "Tokens"](https://github.com/netbox-community/netbox/blob/main/docs/integrations/rest-api.md#tokens) and [netbox/users/models/tokens.py](https://github.com/netbox-community/netbox/blob/main/netbox/users/models/tokens.py):

- v2 tokens (`Authorization: Bearer nbt_<key>.<token>`) store only an HMAC with a configured pepper, so the plaintext cannot be recovered. **v1 tokens are deprecated as of v4.6 and removed in v5.0.** Use v2 only.
- Per-token controls: `enabled`, `expires`, `write_enabled`, and `allowed_ips` (client IP is taken from `HTTP_CLIENT_IP_HEADERS`, so trust only the reverse proxy).
- A token can do anything its user can. The token's `write_enabled = false` and the user's view-only permissions together keep the site from ever writing to NetBox.
- With `users.grant_token`, an automated provisioner can create tokens for other users. NetBox's docs warn to "exercise caution" with this.
- Do not use `?background=true` bulk writes to `/api/users/tokens/`. v4.7.0 and v4.7.1 recorded created tokens' plaintext in job results. Rejected since v4.7.2. (rest-api.md warning)

## Which objects carry a tenant

Models with a direct `tenant` foreign key in v4.7.6 (from `grep "tenant = models.ForeignKey"` across `netbox/*/models`, cross-checked against [docs/features/tenancy.md](https://github.com/netbox-community/netbox/blob/main/docs/features/tenancy.md)):

| App | Models with `tenant` |
|---|---|
| dcim | Site, Location, Rack, RackReservation, Device, VirtualDeviceContext, Cable, PowerFeed, CoolingFeed (CoolingFeed is new and missing from the tenancy doc list) |
| circuits | Circuit, CircuitGroup, VirtualCircuit |
| ipam | Aggregate, Prefix, IPRange, IPAddress, ASN, ASNRange, VLAN, VLANGroup, VRF, RouteTarget |
| virtualization | Cluster, VirtualMachine |
| vpn | Tunnel, L2VPN |
| wireless | WirelessLAN, WirelessLink |

Objects **without** a tenant inherit it only through their parent. Examples:

- Device components (Interface, ConsolePort, ConsoleServerPort, PowerPort, PowerOutlet, FrontPort, RearPort, DeviceBay, ModuleBay, InventoryItem) and Module: via `device__tenant`.
- VMInterface, VirtualDisk: via `virtual_machine__tenant`.
- Service: generic parent (`parent_object_type`/`parent_object_id`), but Device and VirtualMachine expose `related_query_name='device'`/`'virtual_machine'`, so `device__tenant` / `virtual_machine__tenant` work ([ipam/models/services.py](https://github.com/netbox-community/netbox/blob/main/netbox/ipam/models/services.py), [dcim/models/devices.py](https://github.com/netbox-community/netbox/blob/main/netbox/dcim/models/devices.py), [virtualization/models/virtualmachines.py](https://github.com/netbox-community/netbox/blob/main/netbox/virtualization/models/virtualmachines.py)).
- CircuitTermination, cable terminations, MAC addresses, FHRP groups, contacts, journal entries, and change log records do not have a tenant.

**Cables** do have a `tenant` field, but it is set separately from the devices at each end. It is often left empty, and a cross-connect may join two Customers.

### Constraint shapes by object type

Use one ObjectPermission (action `view`) per shape. Replace `T` with the Customer's tenant ID. Use the ID rather than the slug, because the ID never changes. Group the object types like this:

| Permission | Object types | Constraint |
|---|---|---|
| direct | Site, Location, Rack, Device, VirtualMachine, Cluster, Prefix, IPRange, VLAN, VRF, Circuit, … (only what the portal shows) | `{"tenant_id": T}` |
| device children | Interface, FrontPort, RearPort, ConsolePort, PowerPort, Module, InventoryItem, … | `{"device__tenant_id": T}` |
| VM children | VMInterface, VirtualDisk | `{"virtual_machine__tenant_id": T}` |
| services | Service | `[{"device__tenant_id": T}, {"virtual_machine__tenant_id": T}]` |
| IP addresses (if not every IP is tenanted) | IPAddress | `[{"tenant_id": T}, {"interface__device__tenant_id": T}, {"vminterface__virtual_machine__tenant_id": T}]` (the `ip_addresses` GenericRelations use `related_query_name='interface'` on Interface and `'vminterface'` on VMInterface) |
| tenant itself | Tenant | `{"id": T}` |

The validator in `ObjectPermissionForm.clean` rejects a path that does not resolve, so a wrong shape fails when it is saved, not later at query time. That is a useful safety net for provisioning scripts.

Grant only the object types the portal actually shows. Do **not** grant change logs (`core.objectchange`), journal entries, jobs, users or groups, or extras unless needed. These are not tenant-scoped and can quote other objects.

## Options compared

| | A. One service token + app-side filtering | B. Per-Customer account + constrained permissions (recommended) | C. B + app-side checks (recommended setup) |
|---|---|---|---|
| Where isolation is enforced | Portal code only | NetBox database query | Both |
| Effect of one portal bug | Every Customer's data is exposed | Only nested brief views leak (see below) | Both layers must fail |
| Ops cost | 1 token | One user, one group, about 5 permissions and one token per Customer. Scriptable through the REST API by an admin token used only for provisioning, never by the portal. | Same as B |
| Works for objects without a tenant | Only if every query adds the right join filter | Yes, via traversal constraints | Yes |

**REST vs GraphQL**

- *REST.* Simple, cacheable, and has an OpenAPI schema. Every list endpoint is tenant-scoped by the token. Weakness: nested related objects appear as brief representations without a permission check (failure mode 4). Mitigation: request only the fields needed with `?fields=` / `?brief=`, and remove cross-tenant fields (`link_peers`, `connected_endpoints`, `assigned_object`) unless the portal checks them.
- *GraphQL.* Applies permissions to every nested relation, so related objects from another tenant come back as null or empty. Fewer round trips for nested views. Weaknesses: `GRAPHQL_MAX_QUERY_DEPTH` defaults to unlimited and `GRAPHQL_MAX_ALIASES` to 10 ([docs/configuration/graphql-api.md](https://github.com/netbox-community/netbox/blob/main/docs/configuration/graphql-api.md)). That matters only if untrusted clients can write queries; here the portal builds them. Older versions returned *all* objects for an invalid GraphQL filter (fixed in v4.0, [#16946](https://github.com/netbox-community/netbox/issues/16946)).
- Either is fine because the token is the real boundary. Choose GraphQL if the portal will show topology such as connected peers, or REST with field allow-lists if simplicity matters more. The portal should only ever send fixed queries it defines itself, never queries supplied by a Portal User.

## Failure modes that could leak another Customer's data

1. **App filter missed or misspelled (option A).** NetBox ignores unknown GET filter parameters and "silently returns the entire database table content" ([pynetbox README, "Filters validation"](https://github.com/netbox-community/pynetbox/blob/master/README.md)). `DEFAULT_FILTER_BACKENDS` is plain `DjangoFilterBackend` ([netbox/netbox/settings.py](https://github.com/netbox-community/netbox/blob/main/netbox/netbox/settings.py)). This is the main reason not to rely on option A alone.
2. **A broad permission ORed in.** Any unconstrained `view` permission, or one constrained on something other than tenant, on the same model for the portal user or any of its groups is ORed in and removes the scoping. Keep the per-Customer groups separate and give them no other permissions.
3. **Superuser, `EXEMPT_VIEW_PERMISSIONS`, `DEFAULT_PERMISSIONS`, `LOGIN_REQUIRED=False`.** Each one bypasses or widens what a view returns. The portal accounts must not be superusers. `EXEMPT_VIEW_PERMISSIONS` must stay `[]` (the `'*'` wildcard exempts every model) and `DEFAULT_PERMISSIONS` must stay at its default. `LOGIN_REQUIRED` (deprecated, default `True`) must stay `True`. ([security.md](https://github.com/netbox-community/netbox/blob/main/docs/configuration/security.md))
4. **Nested brief views in REST.** A permitted object shows related objects even when the user cannot view them. A NetBox maintainer describes this as "only a minimal representation… ID, name, slug, description, and maybe a couple other incidental attributes". Example: Customer A's interface cabled to Customer B's device shows B's device name in `link_peers` / `connected_endpoints`. Fixing this is a proposed **breaking change planned for v5.0** ([#22525](https://github.com/netbox-community/netbox/issues/22525), open, backlog). Until then, remove or check those fields in the portal, or use GraphQL.
5. **Untenanted or wrongly tenanted data.** With tenant constraints, mistakes fail closed: an object with no tenant stays hidden. The leak is the reverse case, where an object is assigned to the wrong tenant. Shared infrastructure, such as a firewall serving several Customers, should have no tenant, which [tenancy.md](https://github.com/netbox-community/netbox/blob/main/docs/features/tenancy.md) recommends. The portal then cannot show it, and that is a product decision.
6. **Cross-tenant joins on objects the Customer can see.** Cables between Customers, a Customer device in an MSP-owned site or rack (the site name appears as a nested brief view), and Prefixes in a shared VRF.
7. **Token handling.** Using the wrong Customer's token because of a session or mapping bug in the portal. A token leaking to the browser. A long-lived token without `allowed_ips`. Writes accidentally allowed (`write_enabled` left on). Also the v4.7.0 and v4.7.1 background bulk token-creation bug.
8. **Related-object lookup by ID in writes.** Referencing an object by numeric ID skips view checks ([utilities/api.py](https://github.com/netbox-community/netbox/blob/main/netbox/utilities/api.py), `get_related_object_by_attrs`; [#21988](https://github.com/netbox-community/netbox/issues/21988)). This does not matter as long as the portal never writes, and it is one more reason for read-only tokens.
9. **Caches shared across Customers.** If the portal caches NetBox responses, the cache key must include the Customer, or a response fetched with one Customer's token can be served to another.

## Open points to verify on the real instance

- What a to-one GraphQL field returns when the target is restricted (null vs. error) in v4.7.x. [#22525](https://github.com/netbox-community/netbox/issues/22525) says nullability is not yet defined.
- Whether automated provisioning of per-Customer accounts, groups, permissions and tokens is done by a small admin-token script outside the website. Keeping it outside fits "the site never writes to NetBox".
