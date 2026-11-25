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

Every page wraps its content in `marketing/src/layouts/BaseLayout.astro`, which supplies the meta tags, the header (with the audit CTA and "Log in") and the footer. The legal pages wrap theirs in `LegalLayout.astro`, which adds the effective date and the "draft pending attorney review" notice. Site-wide facts such as the portal URL, the legal links and the header nav are in `marketing/src/site.ts`. When a page lands, add it to `NAV` there.

### Check and test

| Command | What it does |
| --- | --- |
| `pnpm lint` | ESLint over the site, Worker and tests. |
| `pnpm typecheck` | `astro check`, covering `.astro` and TypeScript files (Worker and tests included). |
| `pnpm test:worker` | **Seam 1.** Calls the Worker's fetch handler with built `Request`s and a test environment of fakes (`test/worker/harness.ts`). |
| `pnpm test:site` | **Seam 2.** Smoke test over the built `dist/`: every sitemap page exists, internal links resolve, and every page has the audit CTA to `/contact`, a "Log in" link to the portal host, the footer legal links and social meta, and loads nothing from a third-party origin. The legal pages are in the sitemap, each shows an effective date and a draft notice, and the Privacy Policy names its processors, retention periods and cookie use. Run `pnpm build` first. |
| `pnpm test` | Both test suites. |

When you write Worker tests, use `createHarness()`. Give it fake static assets (`assets`), fake upstreams keyed by origin (`upstreams`, e.g. Turnstile siteverify or Postmark), and config overrides (`vars`). Then assert on the `Response` and on `assetRequests` / `upstreamRequests`. The Worker must make upstream calls through `env.fetch ?? fetch`, so that the fakes see them.

### CI

`.github/workflows/marketing-ci.yml` runs on every PR (and on pushes to `main`) that touches `marketing/**` or the workflow itself. It installs, lints, type-checks, builds, and then runs both test suites. Because of the path filters, a PR that doesn't touch the site doesn't run the job. If the job becomes a required check under branch protection, a PR outside these paths will wait on a check that never runs. Use a ruleset that only requires it when it runs, or add a no-op fallback job.
