// Seam 2: the built site. Reads Astro's static output in dist/ (run
// `pnpm build` first) and answers questions a visitor could observe.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { NodeType, parse, type HTMLElement, type Node } from "node-html-parser";

export const SITE_ORIGIN = "https://akimbo.technology";
/** The Client Portal is a separate app on its own hostname (ADR 0001, ADR 0005). */
export const PORTAL_ORIGIN = "https://portal.akimbo.technology";
/** Origins that count as this site; `www` redirects to the apex. */
const SITE_ORIGINS = new Set([SITE_ORIGIN, "https://www.akimbo.technology"]);
// Built from a path, not `new URL(…, import.meta.url)`, so it also works under
// happy-dom (seam 3), whose `URL` global fileURLToPath won't accept.
export const DIST = join(dirname(fileURLToPath(import.meta.url)), "../../dist/");

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

/** The built page at a site path ("/plans/"); throws if there isn't one. */
export function page(path: string): Page {
  const found = pages().find((candidate) => candidate.path === path);
  if (!found) throw new Error(`No built page at ${path}`);
  return found;
}

/**
 * An element's visible text, whitespace collapsed. Text nodes are joined with
 * a space, so adjacent table cells ("$575" then "3 extra…") don't run together.
 */
export function text(el: HTMLElement): string {
  const nodes = (node: Node): string[] =>
    node.nodeType === NodeType.TEXT_NODE
      ? [node.textContent]
      : ["SCRIPT", "STYLE"].includes((node as HTMLElement).tagName)
        ? []
        : node.childNodes.flatMap(nodes);
  return nodes(el).join(" ").replace(/\s+/g, " ").trim();
}

/** Every dollar amount in some text ("$1,250" → 1250). */
export function dollarAmounts(content: string): number[] {
  return [...content.matchAll(/\$(\d[\d,]*)/g)].map((m) => Number(m[1].replaceAll(",", "")));
}

/**
 * The region (an element with aria-labelledby) whose labelling heading's
 * text starts with `heading`; throws if there isn't one.
 */
export function region(page: Page, heading: string): HTMLElement {
  const found = page.html.querySelectorAll("[aria-labelledby]").find((el) => {
    const label = page.html.getElementById(el.getAttribute("aria-labelledby")!);
    return label && text(label).startsWith(heading);
  });
  if (!found) throw new Error(`No region headed "${heading}" on ${page.path}`);
  return found;
}

/** Whether a URL is served by this site (including `www`). */
export function isSameSite(url: URL): boolean {
  return SITE_ORIGINS.has(url.origin);
}

/** The page's own absolute URL, which its relative references resolve against. */
function pageUrl(page: Page): URL {
  return new URL(page.path, SITE_ORIGIN);
}

/** The URLs in an element's srcset (each candidate is "url [descriptor]"). */
function srcsetValues(el: HTMLElement): string[] {
  return (el.getAttribute("srcset") ?? "")
    .split(",")
    .map((candidate) => candidate.trim().split(/\s+/)[0]);
}

/** Inline content (data:, blob:, about:) that loads nothing from any origin. */
const INLINE_SCHEMES = /^(data|blob|about):/i;

/**
 * Same-site URLs a page links to or loads (href, src, srcset), resolved
 * against the page's own URL. Fragments and query strings are dropped.
 */
export function internalReferences(page: Page): URL[] {
  const base = pageUrl(page);
  const attributeValues = page.html
    .querySelectorAll("[href], [src], [srcset]")
    .flatMap((el) => [el.getAttribute("href"), el.getAttribute("src"), ...srcsetValues(el)])
    .filter((value): value is string => Boolean(value));

  return attributeValues.map((value) => new URL(value, base)).filter(isSameSite);
}

export interface Link {
  /** The link's visible text, whitespace collapsed. */
  text: string;
  /** The href, resolved against the page's own URL. */
  url: URL;
}

/** A same-site URL as a visitor sees it in the address bar: "/contact/?service=network-audit". */
export function sitePath(url: URL): string {
  return `${url.pathname}${url.search}`;
}

/** Every `<a href>` on a page, or inside `scope` (a CSS selector) if given. */
export function links(page: Page, scope?: string): Link[] {
  const base = pageUrl(page);
  const roots = scope ? page.html.querySelectorAll(scope) : [page.html];
  return roots.flatMap((root) =>
    root.querySelectorAll("a[href]").map((a) => ({
      text: a.textContent.replace(/\s+/g, " ").trim(),
      url: new URL(a.getAttribute("href")!, base),
    })),
  );
}

/** Attributes whose values a visitor sees or hears, or a link preview shows. */
const READABLE_ATTRIBUTES = ["alt", "title", "aria-label", "placeholder", "content"];

/**
 * The text a visitor could read on the page: its visible text (scripts and
 * styles excluded) and readable attribute values such as alt text and meta
 * descriptions, one string each, whitespace collapsed.
 */
export function readableText(page: Page): string[] {
  const body = page.html.querySelector("body")?.clone() as HTMLElement | undefined;
  body?.querySelectorAll("script, style").forEach((el) => el.remove());
  const attributes = page.html
    .querySelectorAll(READABLE_ATTRIBUTES.map((name) => `[${name}]`).join(", "))
    .flatMap((el) => READABLE_ATTRIBUTES.map((name) => el.getAttribute(name)))
    .filter((value): value is string => Boolean(value));
  return [body?.textContent ?? "", ...attributes].map((text) => text.replace(/\s+/g, " ").trim());
}

/** Whether a URL points at the given site path on this site, ignoring a trailing slash. */
export function isSitePath(url: URL, path: string): boolean {
  return isSameSite(url) && url.pathname.replace(/(.)\/$/, "$1") === path;
}

/** `<link rel>` values that make the browser fetch or connect to the href. */
const LOADING_RELS = new Set([
  "stylesheet",
  "icon",
  "apple-touch-icon",
  "manifest",
  "preload",
  "modulepreload",
  "prefetch",
  "preconnect",
  "dns-prefetch",
]);

/**
 * URLs in CSS `url(...)` and `@import`, resolved against `base`, plus those
 * in any same-site stylesheet it imports, followed recursively.
 */
function cssUrls(css: string, base: URL, seen = new Set<string>()): URL[] {
  const urls = [
    ...css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g),
    ...css.matchAll(/@import\s+(['"])([^'"]+)\1/g),
  ]
    .map((m) => m[2])
    .filter((ref) => !INLINE_SCHEMES.test(ref))
    .map((ref) => new URL(ref, base));
  return [...urls, ...urls.flatMap((url) => stylesheetUrls(url, seen))];
}

/** The URLs a same-site stylesheet loads, or none if `url` isn't one. */
function stylesheetUrls(url: URL, seen: Set<string>): URL[] {
  if (!isSameSite(url) || !url.pathname.endsWith(".css") || seen.has(url.pathname)) return [];
  seen.add(url.pathname);
  const file = servedFile(url.pathname);
  return file ? cssUrls(readFileSync(join(DIST, file), "utf8"), url, seen) : [];
}

/**
 * Every URL a browser would fetch or connect to when loading the page:
 * src/srcset, data, loading `<link>`s, and `url()`/`@import` in inline styles
 * and in the page's own stylesheets. Links a visitor clicks aren't included.
 */
export function loadedUrls(page: Page): URL[] {
  const base = pageUrl(page);
  const attributeUrls = page.html
    .querySelectorAll("[src], [srcset], object[data], link[href]")
    .flatMap((el) => {
      const rels = (el.getAttribute("rel") ?? "").toLowerCase().split(/\s+/);
      return [
        el.getAttribute("src"),
        el.getAttribute("data"),
        el.tagName === "LINK" && rels.some((rel) => LOADING_RELS.has(rel))
          ? el.getAttribute("href")
          : undefined,
        ...srcsetValues(el),
      ];
    })
    .filter((value): value is string => Boolean(value) && !INLINE_SCHEMES.test(value!))
    .map((value) => new URL(value, base));

  const seen = new Set<string>();
  const inlineCss = [
    ...page.html.querySelectorAll("style").map((el) => el.textContent),
    ...page.html.querySelectorAll("[style]").map((el) => el.getAttribute("style")!),
  ].flatMap((css) => cssUrls(css, base, seen));
  const stylesheetCss = attributeUrls.flatMap((url) => stylesheetUrls(url, seen));

  return [...attributeUrls, ...inlineCss, ...stylesheetCss];
}
