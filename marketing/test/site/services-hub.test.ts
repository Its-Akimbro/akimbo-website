import { describe, expect, it } from "vitest";
import { AUDIT, SERVER_TIER, tier } from "../../src/pricing";
import { dollarAmounts, links, page, region, sitemapUrls, SITE_ORIGIN, text } from "./dist";
import { MODULE_PRICES } from "./prices";

const hub = () => page("/services/");
const rows = () => region(hub(), "All services").querySelectorAll("li");

describe("/services hub", () => {
  it("is in the sitemap", () => {
    expect(sitemapUrls()).toContain(`${SITE_ORIGIN}/services/`);
  });

  it("lists the Network Audit first, then the three service pages, each linking on", () => {
    const linked = rows().map((row) =>
      links({ path: "/services/", html: row }).map((link) => ({
        text: link.text,
        to: `${link.url.pathname}${link.url.search}`,
      })),
    );

    expect(linked).toEqual([
      [{ text: "Network audit", to: "/contact/?service=network-audit" }],
      [{ text: "Managed networking", to: "/services/managed-networking/" }],
      [{ text: "Servers and virtualisation", to: "/services/servers-virtualisation/" }],
      [{ text: "Network projects", to: "/services/network-projects/" }],
    ]);
  });

  it("says who each service is a good fit for and how it's billed", () => {
    const missing = rows().flatMap((row) => {
      const content = text(row);
      return [
        !/A good fit if… \S/.test(content) && "good fit if",
        !/How it's billed \S/.test(content) && "billing",
      ]
        .filter(Boolean)
        .map((what) => `${text(row.querySelector("h3")!)} → ${what}`);
    });

    expect(rows()).toHaveLength(4);
    expect(missing).toEqual([]);
  });

  it("bills the audit at its fixed price and the monthly services from their tier's price", () => {
    const billed = rows().map((row) => dollarAmounts(text(row)));

    expect(billed).toEqual([
      [AUDIT.price],
      [tier("essentials").fromPerSite],
      [SERVER_TIER.fromPerSite],
      [],
    ]);
    expect(text(rows()[3])).toMatch(/fixed price, quoted before work starts/i);
  });

  it("shows no dollar amount the pricing module doesn't publish", () => {
    const unknown = dollarAmounts(text(hub().html)).filter((amount) => !MODULE_PRICES.has(amount));

    expect(unknown).toEqual([]);
  });
});
