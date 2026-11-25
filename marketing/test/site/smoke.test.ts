import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DIST, internalReferences, pages, servedFile, sitemapUrls, SITE_ORIGIN } from "./dist";

describe("built site", () => {
  it("is static files with no server entry point", () => {
    const serverEntries = ["_worker.js", "entry.mjs", "server"].filter((name) =>
      existsSync(join(DIST, name)),
    );

    expect(serverEntries).toEqual([]);
  });

  it("lists the home page in the sitemap", () => {
    expect(sitemapUrls()).toContain(`${SITE_ORIGIN}/`);
  });

  it("has a page for every sitemap URL", () => {
    const missing = sitemapUrls().filter((url) => !servedFile(new URL(url).pathname));

    expect(missing).toEqual([]);
  });

  it("has no broken internal links", () => {
    const broken = pages().flatMap((page) =>
      internalReferences(page)
        .filter((url) => !servedFile(url.pathname))
        .map((url) => `${page.path} → ${url.pathname}`),
    );

    expect(broken).toEqual([]);
  });
});
