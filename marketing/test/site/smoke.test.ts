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
  mainText,
  pageAt,
  PORTAL_ORIGIN,
  pages,
  servedFile,
  sitemapUrls,
  SITE_ORIGIN,
} from "./dist";

const LEGAL_PATHS = ["/privacy/", "/terms/", "/accessibility/"];

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

  it("lists every legal page in the sitemap", () => {
    const missing = LEGAL_PATHS.filter((path) => !sitemapUrls().includes(`${SITE_ORIGIN}${path}`));

    expect(missing).toEqual([]);
  });

  it("shows an effective date on every legal page", () => {
    const missing = LEGAL_PATHS.filter((path) => {
      const time = pageAt(path).html.querySelector("main time[datetime]");
      const datetime = time?.getAttribute("datetime") ?? "";
      const label = time?.parentNode?.textContent ?? "";
      return !/^\d{4}-\d{2}-\d{2}$/.test(datetime) || !/effective/i.test(label);
    });

    expect(missing).toEqual([]);
  });

  it("marks every legal page as a draft pending attorney review", () => {
    const missing = LEGAL_PATHS.filter(
      (path) => !/draft[^.]*attorney review/i.test(mainText(pageAt(path))),
    );

    expect(missing).toEqual([]);
  });

  it("has a Privacy Policy that covers what the ticket and spec require", () => {
    const privacy = pageAt("/privacy/");
    const text = mainText(privacy);
    // Each item must appear in the policy (#37, spec #28).
    const required: [string, RegExp][] = [
      ["names Cloudflare", /Cloudflare/],
      ["names Turnstile", /Turnstile/],
      ["names Postmark", /Postmark/],
      ["says Postmark open and click tracking is off", /open and click tracking[^.]*\boff\b/i],
      ["names Microsoft 365", /Microsoft 365/],
      ["says the contact form stores nothing", /stores nothing/i],
      ["says no auto-reply is sent", /no (automatic reply|auto-reply)/i],
      ["says personal information is not sold", /do not sell/i],
      ["gives the audit retention", /90 days after/i],
      ["gives the offboarding retention", /30 days after/i],
      ["gives the backup retention", /within 12 months/i],
      ["covers cookies", /strictly necessary/i],
      ["covers Do Not Track", /Do Not Track/],
      ["covers children", /children/i],
    ];
    const missing = required.filter(([, pattern]) => !pattern.test(text)).map(([what]) => what);

    // No state or EU rights sections that would promise processes Akimbo doesn't run.
    const rightsHeadings = privacy.html
      .querySelectorAll("main h2, main h3")
      .map((heading) => heading.textContent)
      .filter((heading) => /CCPA|CPRA|GDPR|California|European/i.test(heading));

    expect({ missing, rightsHeadings }).toEqual({ missing: [], rightsHeadings: [] });
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
