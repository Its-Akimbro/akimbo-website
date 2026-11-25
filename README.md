# akimbo-website

The public Marketing Site and (later) the Client Portal for Akimbo Technology. See `GLOSSARY.md` for terms and `docs/adr/` for decisions.

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
| `pnpm preview` | Builds, then runs the Marketing Worker locally with `wrangler dev`, serving `dist/` as static assets the way production does. |

To try the `www` redirect locally: `curl -i -H 'Host: www.akimbo.technology' http://localhost:8787/`.

### Brand theme and base layout

The palette, type scale and fonts live in one shared Tailwind v4 file, `brand/theme.css`, which the Client Portal will import too (ADR 0001). The fonts are self-hosted OFL files in `brand/fonts/`, so no page requests a font CDN. `marketing/src/styles/global.css` imports Tailwind and then the theme.

Every page wraps its content in `marketing/src/layouts/BaseLayout.astro`, which supplies the meta tags, the header (with the audit CTA and "Log in") and the footer. The legal pages wrap theirs in `LegalLayout.astro`, which adds the effective date and the "draft pending attorney review" notice. Site-wide facts such as the portal URL, the legal links and the header nav are in `marketing/src/site.ts`. When a page lands, add it to `NAV` there. Content the owner hasn't supplied yet goes in `marketing/src/placeholders.ts`, marked `[TBD: …]` (placeholder images go in `placeholder-assets.ts`, because the Worker imports `placeholders.ts` and can't bundle images), so `grep -r "TBD:"` finds every placeholder before launch.

### Check and test

| Command | What it does |
| --- | --- |
| `pnpm lint` | ESLint over the site, Worker and tests. |
| `pnpm typecheck` | `astro check`, covering `.astro` and TypeScript files (Worker and tests included). |
| `pnpm test:worker` | **Seam 1.** Calls the Worker's fetch handler with built `Request`s and a test environment of fakes (`test/worker/harness.ts`). |
| `pnpm test:site` | **Seam 2.** Smoke test over the built `dist/`: every sitemap page exists, internal links resolve, and every page has the audit CTA to `/contact`, a "Log in" link to the portal host, the footer legal links and social meta, and loads nothing from a third-party origin; every placeholder is marked `[TBD: …]`; About has a self-hosted service-area map; the legal pages are in the sitemap, each shows an effective date and a draft notice, and the Privacy Policy names its processors, retention periods and cookie use. **Seam 3** runs in the same project: `test/site/contact-page.test.ts` loads the built `/contact` page into happy-dom, runs the contact page script (`src/contact-page.ts`) on it, and sends its requests to the Worker's fetch handler. It covers the tabs and their keys, the `?service=` preset, inline validation and the in-page results. Run `pnpm build` first. |
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

`CI gate`, `Lint workflows` and `No infrastructure details` are required checks on `main`.

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

### Repository security settings

The repo is public, and Client Portal and infrastructure issues live in the private `Its-Akimbro/akimbo-infra` (ADR 0006, `docs/agents/issue-tracker.md`). Only the owner and the owner's agents can change anything here:

- **Interaction limit:** only collaborators can open issues or PRs, comment or react. It expires every 6 months; renew it in Settings → Moderation → Interaction limits, or with `gh api -X PUT repos/Its-Akimbro/akimbo-website/interaction-limits -f limit=collaborators_only -f expiry=six_months`.
- **Actions:** the default `GITHUB_TOKEN` is read-only and can't approve PRs. Workflows from every outside contributor wait for the owner's approval.
- **Rulesets:**
  - `main` can't be force-pushed or deleted, by anyone.
  - Changes to `main` need a PR from anyone without admin.
  - Only admins can create, move or delete `marketing/v*` and `portal-edge/v*` tags.
  - Merging to `main` needs the required checks (see **CI**) to pass, for everyone. The owner included, so a direct push to `main` is rejected; merge through a PR.
- **Security:** secret scanning with push protection, Dependabot alerts and Dependabot security updates are on.
