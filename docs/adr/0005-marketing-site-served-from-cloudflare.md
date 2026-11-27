# The Marketing Site is served from Cloudflare; only the Client Portal and NetBox stay on Proxmox

v1 runs on one Proxmox host behind one home uplink, so anything served from the house goes down with it, both in outages and in the monthly maintenance window. The Marketing Site is a static Astro build that holds no data, and it is the first thing a prospect sees, so it is served as Workers static assets on the same Cloudflare Worker that already handles `/api/contact` (`marketing/worker/`). The `web` LXC is dropped, and the Cloudflare Tunnel publishes only the Client Portal hostnames. This widens ADR 0003's exception from the form endpoint to the whole Marketing Site. The rule is now: anything that holds Customer data or touches NetBox stays at home, and the rest may live on Cloudflare.

The Client Portal accepts downtime in v1. There is no replica and no off-host copy of Customer data. A separate pass-through Worker on `portal.akimbo.technology` (`portal-edge/`) replaces Cloudflare's 502/530/1033 origin errors with a branded "temporarily unavailable" page (503, `Retry-After`, never cached) that points to `hello@`, the phone number and business hours. No availability SLA is published.

## Considered Options

- **Proxmox only, accept downtime**: rejected; an infrastructure MSP whose own site vanishes whenever home internet drops undermines the pitch, and keeping the site at home buys nothing because it holds no data.
- **Proxmox primary with a Cloudflare failover copy** (a Worker fetches the tunnel origin and falls back to bundled assets): rejected; two copies to keep in sync, failover logic to test, and the `web` LXC still to patch, all to protect a site that never needed to be at home.
- **Replicating the Client Portal off-host**: rejected; it would put Customer NetBox data on a second system, against the "no NetBox data outside the house" posture, for a look-up reference that MSP Staff can stand in for during an outage.

## Consequences

- The Proxmox layout drops to three LXCs (`netbox`, `portal`, `cloudflared`); the dmz zone keeps `portal` and `cloudflared`.
- This amends ADR 0004's scope: the Marketing Site no longer goes through `akimbo-deploy`. Both Workers deploy from Actions, each with its own Workers-scoped token held only in its own Environments (`portal-edge/` lives in this repo, ADR 0006 as amended). A `marketing/v*` or `portal-edge/v*` tag runs `wrangler versions upload` (with a preview URL), the owner approves promotion in a GitHub Environment, and `wrangler rollback` undoes it. The old `worker/v*` tag folds into `marketing/v*`. The human gate from ADR 0004 is kept.
- Only `marketing/worker/` holds the Postmark enquiry-stream token and the Turnstile secret; `portal-edge/` holds no secrets.
- Because the portal Worker turns origin errors into a 503, `akimbo-deploy` smoke checks must assert the real app's `/healthz` response, not just a 2xx.
- Outages are detected by a 5-minute cron on the host that fetches the portal's public `/healthz` through Cloudflare and pings healthchecks.io only on success; a missed ping alerts the owner.
- The Client Portal Terms state that the portal is provided as available, with planned maintenance in the published monthly window.
