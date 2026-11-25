import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DIST,
  internalReferences,
  isSameSite,
  isSitePath,
  links,
  loadedUrls,
  PORTAL_ORIGIN,
  pages,
  servedFile,
  sitemapUrls,
  SITE_ORIGIN,
} from "./dist";

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

  it("has the primary audit CTA pointing to /contact on every page", () => {
    const missing = pages()
      .filter(
        (page) =>
          !links(page).some(
            (link) =>
              link.text.startsWith("Book a network audit") && isSitePath(link.url, "/contact"),
          ),
      )
      .map((page) => page.path);

    expect(missing).toEqual([]);
  });

  it("links Log in to the Client Portal hostname on every page", () => {
    const missing = pages()
      .filter(
        (page) =>
          !links(page).some(
            (link) => link.text === "Log in" && link.url.origin === PORTAL_ORIGIN,
          ),
      )
      .map((page) => page.path);

    expect(missing).toEqual([]);
  });

  it("links to every legal page from the footer on every page", () => {
    const legalPages = ["Privacy Policy", "Website Terms", "Accessibility statement"];

    const missing = pages().flatMap((page) => {
      const footerLinks = links(page, "footer").filter(
        (link) => isSameSite(link.url) && servedFile(link.url.pathname),
      );
      return legalPages
        .filter((label) => !footerLinks.some((link) => link.text.startsWith(label)))
        .map((label) => `${page.path} → ${label}`);
    });

    expect(missing).toEqual([]);
  });

  it("loads nothing from a third-party origin", () => {
    const thirdParty = pages().flatMap((page) =>
      loadedUrls(page)
        .filter((url) => !isSameSite(url))
        .map((url) => `${page.path} → ${url.href}`),
    );

    expect(thirdParty).toEqual([]);
  });

  it("has a title, description and social preview meta on every page", () => {
    const problems = pages().flatMap((page) => {
      const meta = (selector: string) =>
        page.html.querySelector(selector)?.getAttribute("content")?.trim() ?? "";
      const missing = [
        !page.html.querySelector("title")?.textContent.trim() && "title",
        !meta('meta[name="description"]') && "description",
        !meta('meta[property="og:title"]') && "og:title",
        !meta('meta[property="og:description"]') && "og:description",
      ].filter(Boolean);

      // Crawlers fetch og:image on their own, so it must be an absolute URL
      // to an image this site serves.
      const image = meta('meta[property="og:image"]');
      const imageUrl = URL.canParse(image) ? new URL(image) : undefined;
      if (
        !imageUrl ||
        imageUrl.origin !== SITE_ORIGIN ||
        !/\.(png|jpe?g|webp)$/i.test(imageUrl.pathname) ||
        !servedFile(imageUrl.pathname)
      ) {
        missing.push(`og:image (${image || "none"})`);
      }

      return missing.map((what) => `${page.path} → ${what}`);
    });

    expect(problems).toEqual([]);
  });
});
