import { describe, expect, it } from "vitest";
import { isServiceSlug } from "../../src/services";
import { isSitePath, links, pages, sitemapUrls, SITE_ORIGIN, type Page } from "./dist";

/** The three pages on the shared service-page template (spec #28, issue #35). */
const SERVICE_PAGES = [
  { path: "/services/managed-networking/", slug: "managed-networking" },
  { path: "/services/servers-virtualisation/", slug: "servers-virtualisation" },
  { path: "/services/network-projects/", slug: "network-projects" },
];

function builtPage(path: string): Page {
  const page = pages().find((candidate) => candidate.path === path);
  if (!page) throw new Error(`No built page at ${path}`);
  return page;
}

describe.each(SERVICE_PAGES)("service page $path", ({ path, slug }) => {
  it("is in the sitemap", () => {
    expect(sitemapUrls()).toContain(`${SITE_ORIGIN}${path}`);
  });

  it("points to /plans for pricing", () => {
    const planLinks = links(builtPage(path), "main").filter((link) =>
      isSitePath(link.url, "/plans"),
    );

    expect(planLinks).not.toEqual([]);
  });

  it("links to /contact with its own service slug, which the Worker allows", () => {
    const serviceLinks = links(builtPage(path), "main").filter(
      (link) => isSitePath(link.url, "/contact") && link.url.searchParams.get("service") === slug,
    );

    expect(serviceLinks).not.toEqual([]);
    expect(isServiceSlug(slug)).toBe(true);
  });

  it("ends with the \"every plan starts with an audit\" CTA", () => {
    const main = builtPage(path).html.querySelector("main")!;
    const closing = main.children.at(-1)!;
    const closingPage = { path, html: closing };

    expect(closing.textContent).toMatch(/every plan starts with an audit/i);
    expect(
      links(closingPage).some(
        (link) => link.text.startsWith("Book a network audit") && isSitePath(link.url, "/contact"),
      ),
    ).toBe(true);
  });
});

describe("contact links", () => {
  it("only ever preset an allow-listed service", () => {
    const bad = pages().flatMap((page) =>
      links(page)
        .filter((link) => isSitePath(link.url, "/contact") && link.url.searchParams.has("service"))
        .filter((link) => !isServiceSlug(link.url.searchParams.get("service")))
        .map((link) => `${page.path} → ${link.url.search}`),
    );

    expect(bad).toEqual([]);
  });
});
