import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isServiceSlug } from "../../src/services";
import {
  DIST,
  internalReferences,
  isSameSite,
  isSitePath,
  links,
  loadedUrls,
  PORTAL_ORIGIN,
  pages,
  readableText,
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

  it.each(["/", "/how-we-work/", "/about/", "/privacy/", "/terms/", "/accessibility/"])(
    "lists %s in the sitemap",
    (path) => {
      expect(sitemapUrls()).toContain(`${SITE_ORIGIN}${path}`);
    },
  );

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

  it("marks every placeholder the same way, as [TBD: …]", () => {
    const unmarked = pages().flatMap((page) =>
      readableText(page)
        .flatMap((text) => [...text.matchAll(/\[[^\]]*\]/g)].map((m) => m[0]))
        .filter((bracketed) => !/^\[TBD: [^\]]+\]$/.test(bracketed))
        .map((bracketed) => `${page.path} → ${bracketed}`),
    );

    expect(unmarked).toEqual([]);
  });

  it("shows a service-area map on the About page, served by this site", () => {
    const about = pages().find((page) => page.path === "/about/");
    expect(about, "no /about/ page").toBeDefined();
    const maps = about!.html
      .querySelectorAll("img")
      .filter((img) => /service area/i.test(img.getAttribute("alt") ?? ""))
      .map((img) => new URL(img.getAttribute("src") ?? "", SITE_ORIGIN + about!.path));

    expect(maps).not.toEqual([]);
    expect(maps.filter((url) => !isSameSite(url) || !servedFile(url.pathname))).toEqual([]);
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

  it("only presets an allow-listed service on contact links", () => {
    const bad = pages().flatMap((page) =>
      links(page)
        .filter((link) => isSitePath(link.url, "/contact") && link.url.searchParams.has("service"))
        .filter((link) => !isServiceSlug(link.url.searchParams.get("service")))
        .map((link) => `${page.path} → ${link.url.search}`),
    );

    expect(bad).toEqual([]);
  });
});
