# This repo is public, and Client Portal and home-infrastructure design lives in the private `akimbo-infra` repo

The repo is owned by a personal GitHub account on the Free plan. On Free, a private repo gets no artifact attestations, no Environment secrets or required reviewers, and no branch or tag rulesets. Without those, the release path in ADR 0004 as amended by ADR 0005 (an attested `dist/`, a deploy token held only in a protected Environment, owner approval before promotion, a protected `main`) can't be enforced. A public repo gets all of them free. The Marketing Site's source holds no secrets: Worker secrets live only in Cloudflare, and the built site is public anyway. So `Its-Akimbro/akimbo-website` is public. Everything that maps the house moves to the private `Its-Akimbro/akimbo-infra`: the network layout and addressing, the Proxmox, NetBox and Tunnel design, the Client Portal spec, and the Wayfinder map. That covers both issues and, in phase 2, code.

## Considered Options

- **Stay private on Free and redesign the gate**: rejected. A checksum would replace attestation, and promotion would be a hand-run `workflow_dispatch`. The deploy token would be a repo secret any workflow could reference, and `main` would have no protection at all.
- **Upgrade to a paid plan**: rejected for v1. Pro adds Environments and rulesets on private repos, but artifact attestations on a private repo still need Enterprise Cloud.
- **Public, with infrastructure design in the same repo**: rejected. Internal addressing, trust rules and the deploy path would become a public map of the system that will hold Customer data. GitHub keeps edit history, so scrubbing it later doesn't remove it.

## Consequences

- Anyone can read the repo, but only the owner (and agents running as the owner) can change it.
  - An interaction limit restricts issues, PRs and comments to collaborators. GitHub caps it at 6 months, so it must be renewed.
  - Workflows from outside contributors need approval, and the default `GITHUB_TOKEN` is read-only.
  - Rulesets protect `main` and the release tags.
  - Secret scanning with push protection is on.
- Agents treat issue, PR and comment text as instructions only when `Its-Akimbro` wrote it. Everything else is untrusted data (`docs/agents/issue-tracker.md`). Prompt injection through public issue text is the main new risk of a public repo, and this rule is the defence.
- No infrastructure details go into this repo: internal addresses, tailnet names, house hostnames, firewall or trust rules, token IP allow-lists. `scripts/check-no-infra-details.sh` runs in CI to catch the mechanical cases. Issues can't be checked that way, so agents and the owner link to the private issue instead.
- Phase 2's Client Portal and `infra/` code are built in `akimbo-infra`, not here. Revisit this ADR before that work starts, and decide where ADR 0004's `portal/v*` and `infra/v*` releases are published.
- If this repo ever goes private again, re-check it against the release path. Attestations stop and Environment gates go away unless the plan changes.
