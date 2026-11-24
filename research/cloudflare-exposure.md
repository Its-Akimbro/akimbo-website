# Exposing Proxmox-hosted services through Cloudflare

Research for [#4](https://github.com/Its-Akimbro/akimbo-website/issues/4). Sources were checked against Cloudflare's own docs and plan pages on 2026-11-24. Each claim cites its source.

## Recommendation (TL;DR)

1. **Use Cloudflare Tunnel, not port forwarding.** Run `cloudflared` in its own LXC/VM on Proxmox. Publish only the website's hostnames (for example `akimbo.technology`, `www.`, `portal.`). Open no inbound ports on the router.
2. **NetBox gets no published hostname at all.** Not in the tunnel, not in DNS, not behind Access. The website backend reaches NetBox over a private Proxmox bridge/VLAN. A Proxmox (or guest) firewall allows NetBox's HTTP(S) port only from the backend's IP.
3. **TLS:** set the zone to Full (strict). Inside the tunnel, cloudflared talks to the origin over HTTPS with verification on (`noTLSVerify: false`, plus `caPool`/`originServerName` for a private CA). Plain HTTP on an isolated host-local link is an acceptable simpler fallback.
4. **Cloudflare Access (free tier):** use it for **admin surfaces** (Proxmox UI, any staging/admin hostname). Do **not** use it as the Client Portal's auth layer. Portal Users need per-Customer identity in the app itself, and every Access login takes one of only 50 free seats.
5. Keep `cloudflared` updated. Only versions within one year of the latest release are supported.

## 1. Cloudflare Tunnel vs port forwarding + proxied DNS

### Tunnel

- `cloudflared` "initiates an outbound connection through your firewall" to Cloudflare. You can "block all inbound traffic", and the origin needs no publicly routable IP. ([Cloudflare Tunnel overview](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/))
  - This matters on a home or small-business line: it works behind CGNAT and dynamic IPs, and the home IP never shows up in DNS.
- Egress needed: port **7844 over TCP and UDP** (UDP for QUIC, TCP for the http2 fallback) to `region1/region2.v2.argotunnel.com`. Port 443 to `api.cloudflare.com`, `update.argotunnel.com` and others is optional (updates, Access JWT validation). A setup with all ingress blocked is explicitly supported. ([Tunnel with firewall](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/configure-tunnels/tunnel-with-firewall/))
- The protocol defaults to `auto`. That means QUIC, with an http2 fallback if UDP is blocked. ([run parameters](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/configure-tunnels/cloudflared-parameters/run-parameters/))
- Routing works through a CNAME to `<UUID>.cfargotunnel.com`. That subdomain "only proxies traffic for DNS records in the same Cloudflare account". If the tunnel is down, visitors get error 1016. Published apps inherit the hostname's Cloudflare settings, such as WAF and cache rules. ([Tunnel DNS](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/dns/))
- High availability: one tunnel can run many `cloudflared` connectors (replicas). Limits: up to 25 active replicas per tunnel and 1,000 tunnels per account. ([overview](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/), [account limits](https://developers.cloudflare.com/cloudflare-one/account-limits/))
  - On a single Proxmox host, a second replica only protects against the LXC failing, not the host or the ISP.
- Authenticated Origin Pulls "has no effect" on Tunnel hostnames, because origin traffic is already authenticated with the connector credentials. ([overview](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/))
- Install: there is a Cloudflare package repository, .deb/.rpm packages, and a `cloudflare/cloudflared` Docker image. "Cloudflare supports versions of `cloudflared` that are within one year of the most recent release." ([downloads](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/))

### Port forwarding + proxied (orange-cloud) DNS

- This needs a public IPv4 address (no CGNAT) and stable or DDNS-updated A records. The origin's IP is real, so anyone who finds it can bypass Cloudflare.
- Cloudflare's guidance: allow the Cloudflare IP ranges (cloudflare.com/ips) at the origin and "block traffic from all other sources". That ACL has to be kept in sync as the ranges change. ([Cloudflare IP addresses](https://developers.cloudflare.com/fundamentals/concepts/cloudflare-ip-addresses/))
- Only certain ports are proxied: HTTPS on 443, 2053, 2083, 2087, 2096 and 8443, and HTTP on 80, 8080 and others. ([network ports](https://developers.cloudflare.com/fundamentals/reference/network-ports/))
- Access docs say a tunnel "is not strictly required" for an Access app, but without one you must protect the origin IP by other means. ([self-hosted public app](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/))

**Verdict:** Tunnel is better on every axis that matters here: no exposed IP, no inbound ports, no IP-range ACL upkeep, and it works behind CGNAT. Port forwarding has no advantage at this scale.

## 2. TLS end to end

- Edge (visitor to Cloudflare): Universal SSL covers the apex and **first-level subdomains** only. Hostnames like `dev.portal.akimbo.technology` "are not covered and will not serve a valid certificate" unless you buy Advanced Certificate Manager or similar. **Keep all public hostnames one level deep.** ([Universal SSL limitations](https://developers.cloudflare.com/ssl/edge-certificates/universal-ssl/limitations/))
- Zone encryption mode: Cloudflare recommends Full or Full (strict). Flexible sends plaintext to the origin. Automatic SSL/TLS can upgrade the mode but never downgrades it. ([SSL modes](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/))
  - The SSL modes page says nothing about how the mode interacts with Tunnel. With Tunnel, the Cloudflare-to-origin leg is the tunnel itself, and the cloudflared-to-service leg is controlled by the ingress `service` URL and origin parameters. Set Full (strict) anyway, so any non-tunnel record cannot silently fall back to plaintext. *(Inference; not stated on the page.)*
- Leg from cloudflared to the service (inside Proxmox):
  - `service: https://...` with `noTLSVerify: false` (the default) verifies the origin certificate.
  - `caPool` adds a private CA. Use it with a self-signed or internal-CA certificate on the web LXC.
  - `originServerName` sets the expected certificate name.
  - `http2Origin` requires HTTPS.

  ([origin parameters](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/configure-tunnels/cloudflared-parameters/origin-parameters/))

  If cloudflared and the web server share a host or an isolated bridge, `http://` on that leg is a reasonable simplification. Avoid `noTLSVerify: true`, which accepts any certificate.
- Leg from the backend to NetBox: this is a private LAN call, not covered by Cloudflare docs. Use HTTPS with an internal certificate, or isolate it on a host-only bridge. *(Inference.)*

## 3. Cloudflare Access (Zero Trust free tier)

### Plan facts

- Zero Trust Free costs "$0 forever" for **50 users**. Support is "Community forums + Discord", and standard log retention is "Up to 24 hours". Pay-as-you-go is $7/user/month. ([Zero Trust plans](https://www.cloudflare.com/plans/sase-zero-trust.md))
- A seat is taken by "any authentication event", including an Access login. When seats run out, "additional users who attempt to log in are blocked". Seat expiration can free inactive users after 1 to 12 months. ([seat management](https://developers.cloudflare.com/cloudflare-one/team-and-resources/users/seat-management/))
- Limits: 500 Access applications, 50 IdPs, and 50 service tokens per account. ([account limits](https://developers.cloudflare.com/cloudflare-one/account-limits/))
- One-time PIN login emails a single-use code that expires in 10 minutes. It works "as an alternative to integrating an identity provider". ([One-time PIN](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/))
- Policy actions are Allow, Block, Bypass and Service Auth. "Bypass does not enforce any Access security controls and requests are not logged." ([policies](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/))
- Origins should validate the `Cf-Access-Jwt-Assertion` header against `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`. Check `iss`, `aud`, `exp` and `nbf`, and match `kid` rather than hard-coding a key, because keys rotate about every 6 weeks. ([validate JWT](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/))

### Is it worth it?

| Surface | Use Access? | Why |
|---|---|---|
| Proxmox web UI, other admin tools | **Yes**, if they need remote access at all | The owner is one seat. One-time PIN or GitHub/Google IdP with an `Emails` allow rule. Strong outer gate at no cost. |
| Staging/preview hostname | **Yes** | Same as above. |
| Client Portal | **No** as the primary auth (optional later) | Portal Users must map to exactly one Customer (see GLOSSARY.md), which the app must enforce anyway. The 50-seat cap counts every Portal User across all Customers, and when it fills, new logins are blocked. Access also makes login a Cloudflare-branded flow. It could be added later as a coarse outer gate, with the app validating the JWT and still doing its own per-Customer scoping. |
| Marketing Site | No | Public by definition. |
| NetBox | **No: never published** | An Access-protected hostname is still a public hostname. The requirement is that NetBox is never publicly exposed, so it gets no tunnel route. For remote admin of NetBox, use the LAN, a VPN, or Cloudflare's private-network routing (WARP client + tunnel private network). That last option is a separate decision. |

## 4. Keeping NetBox reachable only from the site's backend

Design (inference from the above; none of this is Cloudflare-specific):

- The tunnel ingress lists only the website service(s) and ends with the catch-all `http_status:404`. NetBox does not appear in the cloudflared config, and there is no DNS record for it in the public zone.
- NetBox lives on an internal Proxmox bridge/VLAN. A firewall (Proxmox datacenter/VM firewall or nftables in the guest) allows NetBox's port only from the website backend's IP, plus the owner's admin path.
- The `cloudflared` LXC can reach only the website's port, not NetBox. Because the tunnel exposes "only services in your tunnel configuration" ([Tunnel with firewall](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/configure-tunnels/tunnel-with-firewall/)), a misconfigured ingress rule is the main risk. Firewalling cloudflared away from NetBox is defence in depth.
- The backend uses a read-only NetBox API token (Source of Truth, never written back).

## Free-tier limits that matter here

- Zero Trust: 50 seats, 24h logs, community support only.
- Tunnel: 1,000 tunnels, 25 replicas per tunnel, and published apps per tunnel limited only by a 1 MB config size.
- Universal SSL: first-level subdomains only.

## Open questions / not verified

- Cloudflare's free-plan request-body size limit on proxied traffic was not checked. It matters if the portal ever accepts uploads, which is unlikely since the portal is read-only.
- Whether the owner wants remote NetBox admin through Cloudflare's private network (WARP) or a separate VPN (WireGuard/Tailscale) is a separate decision.
- Remotely-managed (dashboard/token) versus locally-managed (config.yml) tunnels: the docs' get-started flow leads with dashboard/API creation. A locally-managed config file is easier to keep in git. Not compared in depth.
