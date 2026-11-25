# Client Portal reads NetBox via GraphQL with fixed queries

The Client Portal reads NetBox only through its GraphQL API, using fixed queries defined in portal code and executed with the Customer's own read-only v2 token. Portal Users never send queries. GraphQL applies ObjectPermissions to every nested relation, so a related object the token can't view comes back empty. REST serializers today return nested brief objects (`link_peers`, `connected_endpoints`, `site`, …) without permission checks, which can leak another Customer's names. NetBox v5.0 plans to fix that as a breaking change ([netbox#22525](https://github.com/netbox-community/netbox/issues/22525)). Choosing GraphQL gives the v5.0 behaviour from day one, and each query's field selection *is* the per-type field allowlist.

## Considered Options

- **REST + pynetbox**: familiar to Python developers, with `count` and an OpenAPI schema. But every response needs cross-tenant fields stripped by hand until v5.0, and then its shapes break.
- **REST and GraphQL mixed**: two clients and two permission behaviours to reason about.

## Consequences

- Related objects the Customer doesn't own come back null unless the token can view them. Each Customer therefore also gets:
  - unconstrained `view` on **catalog** models through a shared group: Manufacturer, DeviceType, DeviceRole, Platform, CircuitType
  - per-Customer `view` on **Shared Object** containers, constrained by reverse traversal: Site, Location, Rack, VRF, Provider (e.g. Site `[{"tenant_id": X}, {"devices__tenant_id": X}]`)

  The portal renders these as plain text only. Onboarding grows to about 10 ObjectPermissions per Customer.
- Lists, filters, pagination and overview counts are computed in the portal from each type's full tenant-scoped set. That set is held in the 5-minute Customer-keyed cache. Revisit if a Customer passes about 2,000 objects of one type.
- The NetBox version is pinned. Every upgrade waits for a contract and leak test suite, run against a restored copy with two test Customers' tokens. It checks response shapes, that neither Customer can see the other's objects, and that restricted relations come back null.
- Still to verify on the real instance: whether a restricted to-one field returns null or an error in v4.7.x, and whether reverse-traversal constraints work without duplicate rows.
