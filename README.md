# akimbo-website

The public Marketing Site for Akimbo Technology, and the Client Portal's edge Worker. The Client Portal itself is in the private `Its-Akimbro/akimbo-infra`. See `GLOSSARY.md` for terms and `docs/adr/` for decisions.

## Marketing Site (`marketing/`)

A static Astro site served by the **Marketing Worker** (`marketing/worker/`) as Workers static assets on `akimbo.technology`. `www.akimbo.technology` redirects to the apex (ADR 0001, ADR 0005).

### Prerequisites

- Node 22 (`marketing/.nvmrc`)
- pnpm, the version pinned in `marketing/package.json` (`corepack enable pnpm` picks it up)

All commands below run from `marketing/`:

```sh
cd marketing
pnpm install
```

### Develop

| Command | What it does |
| --- | --- |
| `pnpm dev` | Astro dev server with hot reload, for working on pages. It doesn't run the Worker. |
| `pnpm build` | Builds the static site into `dist/`. No server code is emitted. |
| `pnpm preview` | Builds, then runs the Marketing Worker locally with `wrangler dev`, serving `dist/` as static assets the way production does. `/api/contact` needs test secrets in `marketing/.dev.vars`; the `run-site` skill (`.claude/skills/run-site/`) has the values and the checks to run. |

To try the `www` redirect locally: `curl -i -H 'Host: www.akimbo.technology' http://localhost:8787/`.

### Brand theme and base layout

The palette, type scale and fonts live in one shared Tailwind v4 file, `brand/theme.css`, which the Client Portal will import too (ADR 0001). The fonts are self-hosted OFL files in `brand/fonts/`, so no page requests a font CDN. `marketing/src/styles/global.css` imports Tailwind and then the theme.

Every page wraps its content in `marketing/src/layouts/BaseLayout.astro`, which supplies the meta tags, the header (with the audit CTA and "Log in") and the footer. The legal pages wrap theirs in `LegalLayout.astro`, which adds the effective date and the "draft pending attorney review" notice. Site-wide facts such as the portal URL, the legal links and the header nav are in `marketing/src/site.ts`. When a page lands, add it to `NAV` there. Content the owner hasn't supplied yet goes in `marketing/src/placeholders.ts`, marked `[TBD: …]` (placeholder images go in `placeholder-assets.ts`, because the Worker imports `placeholders.ts` and can't bundle images), so `grep -r "TBD:"` finds every placeholder before launch.

### Check and test

| Command | What it does |
| --- | --- |
| `pnpm lint` | ESLint over the site, Worker and tests. |
| `pnpm typecheck` | `astro check`, covering `.astro` and TypeScript files (Worker and tests included). |
| `pnpm test:unit` | Plain modules, such as the pricing data and the brand red rule (red only on the audit CTA and error styles, `src/error-styles.ts`). |
| `pnpm test:worker` | **Seam 1.** Calls the Worker's fetch handler with built `Request`s and a test environment of fakes (`test/worker/harness.ts`). |
| `pnpm test:site` | **Seam 2.** Smoke test over the built `dist/`: every sitemap page exists, internal links resolve, and every page has the audit CTA to `/contact`, a "Log in" link to the portal host, the footer legal links and social meta, and loads nothing from a third-party origin; every placeholder is marked `[TBD: …]`; About has a self-hosted service-area map; the legal pages are in the sitemap, each shows an effective date and a draft notice, and the Privacy Policy names its processors, retention periods and cookie use. **Seam 3** runs in the same project: `test/site/contact-page.test.ts` loads the built `/contact` page into happy-dom, runs the contact page script (`src/contact-page.ts`) on it, and sends its requests to the Worker's fetch handler. It covers the tabs and their keys, the `?service=` preset, inline validation and the in-page results. Run `pnpm build` first; the suite refuses a `dist/` older than its sources. |
| `pnpm test` | All the test suites. |
| `pnpm check:bundle` | Bundles the Worker with `wrangler deploy --dry-run`, the way a release uploads it, without deploying. Run `pnpm build` first. Vitest bundles through Vite, which can load files (such as `.svg`) that wrangler can't, so this check catches a Worker import that only works under test. |

When you write Worker tests, use `createHarness()`. Give it fake static assets (`assets`), fake upstreams keyed by origin (`upstreams`, e.g. Turnstile siteverify or Postmark), and config overrides (`vars`). Then assert on the `Response` and on `assetRequests` / `upstreamRequests`. The Worker must make upstream calls through `env.fetch ?? fetch`, so that the fakes see them.

The contact forms work without JavaScript. With it, `src/contact-page.ts` turns them into tabs, presets the service from `?service=`, checks each field by the Worker's own rules (shared in `src/contact-form.ts`) and posts JSON to `/api/contact`, showing the confirmation or errors in the page. When sending fails, it shows a `mailto:` link. Its tests call `openContactPage()` from `test/site/contact-page.ts` and act through roles, labels and keys, as a visitor would. A test file that uses it starts with `// @vitest-environment happy-dom`.

### CI

Two workflows run on every PR:

- **`marketing-ci.yml`:**
  - Its `changes` job decides whether the PR touches the site: `marketing/`, `brand/`, or the marketing workflows. If it does, the workflow installs, lints, type-checks, builds, bundles the Worker (`pnpm check:bundle`) and runs the test suites. A separate **Dependency audit** job runs `pnpm audit` and fails on an advisory of any severity.
  - **CI gate** passes when those jobs passed, or were skipped because nothing relevant changed, and fails otherwise.
  - Pushes to `main` that touch those paths run it too, and so does the release workflow.
- **`repo-checks.yml`:**
  - **Lint workflows** runs actionlint, with shellcheck on every `run:` script, over `.github/workflows/`.
  - **No infrastructure details** runs `scripts/check-no-infra-details.sh` (ADR 0006).

`CI gate`, `Portal edge CI gate`, `Lint workflows` and `No infrastructure details` are required checks on `main`.

### Dependencies

Dependabot (`.github/dependabot.yml`) opens one grouped PR a week for minor and patch updates to the pnpm dependencies in `marketing/`, and one for GitHub Actions. Each major update gets its own PR, and grouped security PRs open as soon as an advisory lands. TypeScript majors are ignored until typescript-eslint and `astro check` support TypeScript 7. Security fixes ship within 7 days.

### Release

Releases follow ADR 0004 as amended by ADR 0005. To release, tag a commit that is already on `main`:

```sh
git switch main && git pull
git tag -a marketing/v1.2.0 -m "marketing v1.2.0"
git push origin marketing/v1.2.0
```

`.github/workflows/marketing-release.yml` then:

1. **Refuses the tag** unless it is `marketing/vMAJOR.MINOR.PATCH` and points at a commit on `main`.
2. **Reruns CI** on the tagged commit (the CI workflow, called as a reusable workflow) and keeps the `dist/` that CI built and tested.
3. **Creates a GitHub Release** named after the tag, with that `dist/` attached as `marketing-<version>-dist.tar.gz` and a build-provenance attestation for it.
4. **Uploads a Worker version** (`marketing-preview` Environment). It downloads the released tarball, checks its attestation with `gh attestation verify`, and runs `wrangler versions upload`. The job summary shows the version's **preview URL**. Nothing is live yet.
5. **Promotes** (`marketing-production` Environment). The job waits for the owner to approve the deployment in the Actions run. After approval, it runs `wrangler versions deploy <version>@100%`.

To skip a release, reject the deployment. The uploaded version stays unused. Copy and design are checked by hand on the preview URL before approving (spec #28, testing decisions).

### Rollback

From `marketing/`, logged in with `wrangler login` on the admin workstation:

```sh
pnpm exec wrangler rollback --message "<reason>"
```

This puts the previous deployed version back on 100% of traffic in seconds. To pick a specific version, run `pnpm exec wrangler deployments list` and then `pnpm exec wrangler rollback <version-id> --message "<reason>"`. A rollback doesn't touch Worker secrets. Afterwards, fix forward with a new `marketing/v*` tag.

### Secrets and settings the release needs

Both GitHub Environments already exist, with the settings below. The Cloudflare token, the account ID and the Worker secrets are added by hand in the setup ticket (#42). The workflows expect these names:

| Name | Kind | Where | Notes |
| --- | --- | --- | --- |
| `marketing-preview` | GitHub Environment | repo settings | Deployment tags limited to `marketing/v*`. No reviewers. |
| `marketing-production` | GitHub Environment | repo settings | Deployment tags limited to `marketing/v*`. Required reviewer: the owner, with "Prevent self-review" off, since the owner both tags and approves. |
| `CLOUDFLARE_API_TOKEN` | Environment secret | both Environments | The Workers-scoped deploy token (Workers Scripts and routes only). It is never a repository secret. List it in the expiry register. |
| `CLOUDFLARE_ACCOUNT_ID` | Repository variable | repo settings | Not a secret. |
| `POSTMARK_TOKEN`, `TURNSTILE_SECRET` | Worker secrets | Cloudflare | Set from the admin workstation with `pnpm exec wrangler secret put <NAME>`. They carry over to every uploaded version and never pass through CI. |

Preview URLs must be enabled on the account's `workers.dev` subdomain. `wrangler.jsonc` sets `preview_urls: true` for the Worker. If no preview URL comes back, the upload job fails rather than ask for approval blind.

## Portal edge Worker (`portal-edge/`)

A pass-through Worker on `portal.akimbo.technology` only, not on the admin hostname (ADR 0005; ADR 0006 as amended for why it lives here). It forwards every request to the Client Portal through the Cloudflare Tunnel, with redirects returned as they are and Cloudflare told not to cache anything. It changes nothing unless the portal is down. It holds no secrets.

When the origin can't be reached, or answers 502 (cloudflared can't reach the portal guest) or 530 (error 1033: no tunnel connector is up), it answers with the branded **"Client Portal temporarily unavailable"** page instead. That response is a 503 with `Retry-After: 300` and `Cache-Control: no-store`, and the page gives `hello@`, the phone number and business hours. Every other response passes through byte-for-byte, the portal's own 5xx pages included. The page reads those facts from `marketing/src/site.ts` and `pricing.ts`, and its look from `brand/`. `scripts/build-page.mjs` builds its CSS with Tailwind and inlines the fonts and the lockup, so it loads nothing from any origin.

Commands, from `portal-edge/` after `pnpm install`:

| Command | What it does |
| --- | --- |
| `pnpm build` | Builds the outage page's assets into `build/` (git-ignored). The other commands run it first. |
| `pnpm preview` | Runs the Worker with `wrangler dev` pointed at an unreachable origin, so every page is the outage page. |
| `pnpm lint` / `pnpm typecheck` | ESLint; `tsc`. |
| `pnpm test` | **Seam 5 of spec #16:** the fetch handler with a fake origin (`test/harness.ts`). It covers pass-through, the 502/530/unreachable mapping, no caching (the origin request is `no-store` and the Cache API is never touched), the outage page's content and WCAG 2.2 AA basics, and the route in `wrangler.jsonc`. |
| `pnpm check:bundle` | Bundles with `wrangler deploy --dry-run`, as a release would. |

**CI:** `portal-edge-ci.yml` runs those checks plus `pnpm audit` when a PR touches `portal-edge/`, `brand/`, the three Marketing Site modules the page reads, or the edge workflows. **Portal edge CI gate** is its required check.

**Release:** tag a commit on `main` with `portal-edge/vMAJOR.MINOR.PATCH`. `portal-edge-release.yml` refuses tags not on `main`, reruns CI, uploads a version with `wrangler versions upload` (`portal-edge-preview`), and waits for the owner to approve `portal-edge-production`, which runs `wrangler versions deploy <version>@100%`. The preview URL forwards to the live portal, so it checks the pass-through. To see the outage page, run `pnpm preview`. Nothing in a Marketing Site release touches this Worker: each has its own tags, workflows, Environments and token.

**Rollback:** from `portal-edge/`, `pnpm exec wrangler rollback --message "<reason>"` (see the Marketing Site's Rollback above for picking a version).

**Settings it needs** (added by hand, as for the Marketing Worker):

| Name | Kind | Notes |
| --- | --- | --- |
| `portal-edge-preview` | GitHub Environment | Deployment tags limited to `portal-edge/v*`. No reviewers. |
| `portal-edge-production` | GitHub Environment | Deployment tags limited to `portal-edge/v*`. Required reviewer: the owner, "Prevent self-review" off. |
| `CLOUDFLARE_API_TOKEN` | Environment secret, both | Its own Workers-scoped token (Workers Scripts and the zone's Workers Routes), not the Marketing Worker's. List it in the expiry register. |
| `CLOUDFLARE_ACCOUNT_ID` | Repository variable | Shared with the Marketing Site. |

`wrangler versions upload` can't create a Worker or change its route. The first time, and whenever the route in `wrangler.jsonc` changes, the owner runs `pnpm exec wrangler deploy` from the admin workstation. The portal relies on `CF-Connecting-IP` for its rate limits and audit log. Cloudflare keeps the visitor's address in that header only on a Worker's requests to its own zone, so the Worker must stay on the `akimbo.technology` zone.

## Repository security settings

The repo is public, and Client Portal and infrastructure issues live in the private `Its-Akimbro/akimbo-infra` (ADR 0006, `docs/agents/issue-tracker.md`). Only the owner and the owner's agents can change anything here:

- **Interaction limit:** only collaborators can open issues or PRs, comment or react. It expires every 6 months; renew it in Settings → Moderation → Interaction limits, or with `gh api -X PUT repos/Its-Akimbro/akimbo-website/interaction-limits -f limit=collaborators_only -f expiry=six_months`.
- **Actions:** the default `GITHUB_TOKEN` is read-only and can't approve PRs. Workflows from every outside contributor wait for the owner's approval.
- **Rulesets:**
  - `main` can't be force-pushed or deleted, by anyone.
  - Changes to `main` need a PR from anyone without admin.
  - Only admins can create, move or delete `marketing/v*` and `portal-edge/v*` tags.
  - Merging to `main` needs the required checks (see **CI**) to pass, for everyone. The owner included, so a direct push to `main` is rejected; merge through a PR.
- **Security:** secret scanning with push protection, Dependabot alerts and Dependabot security updates are on.
