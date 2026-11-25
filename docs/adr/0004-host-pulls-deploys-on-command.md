# Deploys are pulled by the Proxmox host on command; CI never gets a path into the home network

GitHub Actions builds each app from a per-app tag on `main` (`marketing/v*`, `portal/v*`, `infra/v*`) and publishes it as a GitHub Release with build-provenance attestation, but it never deploys to the Proxmox host. The owner runs `akimbo-deploy <app> <tag>` on the host over Tailscale SSH; the script downloads the release with a read-only fine-grained token, verifies the attestation, `pct push`es it into the guest (guests run no sshd), swaps a `current` symlink, restarts, smoke-checks through the tunnel, and rolls back automatically on failure. With no staging in v1, that human trigger is the last gate, and nothing outside the house holds a credential into it.

## Considered Options

- **CI pushes over Tailscale** (Actions joins the tailnet, SSHes to the host as root): rejected; a CI secret becomes root on the hypervisor that also holds NetBox and every Customer's data.
- **Self-hosted runner on the host**: rejected; any workflow change would execute repo code on the hypervisor.
- **Host pulls on a timer** (auto-deploy every new release): rejected for v1; with no staging, a merged-and-tagged mistake would go live unattended.

## Consequences

- The host keeps one read-only GitHub token (Contents + Attestations, this repo only, 12-month expiry) and a read-only clone of the repo at `/opt/akimbo` for `infra/` files and scripts; it is recreated, not restored, in disaster recovery.
- Portal migrations must be backward-compatible (expand, then contract a release later) so a code rollback doesn't need a database restore; a deploy takes a SQLite `.backup` first for the cases that can't be.
- The contact-form Worker is the exception: it deploys from Actions on a `worker/v*` tag with a Workers-scoped Cloudflare token, since it lives on Cloudflare, not in the house.
