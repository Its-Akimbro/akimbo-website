// Seam 2: the built site. Reads Astro's static output in dist/ (run
// `pnpm build` first) and answers questions a visitor could observe.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parse, type HTMLElement } from "node-html-parser";

export const SITE_ORIGIN = "https://akimbo.technology";
/** Origins that count as this site; `www` redirects to the apex. */
const SITE_ORIGINS = new Set([SITE_ORIGIN, "https://www.akimbo.technology"]);
export const DIST = fileURLToPath(new URL("../../dist/", import.meta.url));

if (!existsSync(join(DIST, "index.html"))) {
  throw new Error(`No built site at ${DIST}. Run \`pnpm build\` first.`);
}

/** Every file in dist/, as a site path ("/", "/plans/", "/favicon.svg"). */
function sitePaths(dir = DIST): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return sitePaths(full);
    return ["/" + relative(DIST, full).split(sep).join("/")];
  });
}

/** Absolute URLs listed in the sitemap index and its child sitemaps. */
export function sitemapUrls(): string[] {
  const locs = (file: string) =>
    [...readFileSync(join(DIST, file), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (m) => m[1],
    );
  return locs("sitemap-index.xml").flatMap((child) =>
    locs(new URL(child).pathname.slice(1)),
  );
}

/**
 * The file a site path would be served from, as Workers static assets
 * resolves it (`/plans/` → `plans/index.html`, `/plans` → `plans.html` or
 * `plans/index.html`), or undefined if nothing in dist/ matches.
 */
export function servedFile(pathname: string): string | undefined {
  const path = decodeURIComponent(pathname);
  const candidates = path.endsWith("/")
    ? [`${path}index.html`]
    : [path, `${path}.html`, `${path}/index.html`];
  return candidates.find((candidate) => existsSync(join(DIST, candidate)));
}

export interface Page {
  /** The page's own site path, e.g. "/" or "/plans/". */
  path: string;
  html: HTMLElement;
}

/** Every built HTML page. */
export function pages(): Page[] {
  return sitePaths()
    .filter((path) => path.endsWith(".html"))
    .map((file) => ({
      path: file.replace(/index\.html$/, ""),
      html: parse(readFileSync(join(DIST, file), "utf8")),
    }));
}

/**
 * Same-site URLs a page links to or loads (href, src, srcset), resolved
 * against the page's own URL. Fragments and query strings are dropped.
 */
export function internalReferences(page: Page): URL[] {
  const base = new URL(page.path, SITE_ORIGIN);
  const attributeValues = page.html
    .querySelectorAll("[href], [src], [srcset]")
    .flatMap((el) => [
      el.getAttribute("href"),
      el.getAttribute("src"),
      ...(el.getAttribute("srcset") ?? "")
        .split(",")
        .map((candidate) => candidate.trim().split(/\s+/)[0]),
    ])
    .filter((value): value is string => Boolean(value));

  return attributeValues
    .map((value) => new URL(value, base))
    .filter((url) => SITE_ORIGINS.has(url.origin));
}
