import { describe, expect, it } from "vitest";
import { AUDIT, CURRENCY, formatUsd, pricesAsOfLabel } from "../../src/pricing";
import {
  dollarAmounts,
  isSitePath,
  links,
  page,
  readableText,
  region,
  sitemapUrls,
  SITE_ORIGIN,
  text,
} from "./dist";

const PATH = "/services/network-audit/";
const audit = () => page(PATH);

/** A regex fragment matching a count as digits, or 1 as "one". */
function countPattern(n: number): string {
  return n === 1 ? "(?:1|one)" : String(n);
}

describe("/services/network-audit", () => {
  it("is in the sitemap", () => {
    expect(sitemapUrls()).toContain(`${SITE_ORIGIN}${PATH}`);
  });

  it("shows the fixed price from the pricing module", () => {
    expect(dollarAmounts(text(region(audit(), "Price and scope")))).toContain(AUDIT.price);
  });

  it("states the scope: one site, the device limit, endpoints, time on site, no remediation", () => {
    const scope = text(region(audit(), "Price and scope"));

    expect(scope).toMatch(new RegExp(`\\b${countPattern(AUDIT.sites)} sites?\\b`, "i"));
    expect(scope).toMatch(new RegExp(`up to ${countPattern(AUDIT.maxDevices)} infrastructure devices`, "i"));
    expect(scope).toMatch(/endpoints[^.]*scanned[^.]*not counted/i);
    expect(scope).toMatch(new RegExp(`up to ${countPattern(AUDIT.daysOnSite)} days? on site`, "i"));
    expect(scope).toMatch(/remediation[^.]*(isn't|is not|not) included|excludes? remediation/i);
  });

  it("prices extra sites and each further block of devices from the add-on price", () => {
    const scope = text(region(audit(), "Price and scope"));

    expect(scope).toContain(`from +${formatUsd(AUDIT.addOnFrom)}`);
    expect(scope).toMatch(/extra sites?/i);
    expect(scope).toMatch(new RegExp(`further ${AUDIT.addOnDeviceBlock} devices`, "i"));
  });

  it("lists the deliverables, with the walkthrough length from the pricing module", () => {
    const deliverables = text(region(audit(), "What you get"));
    const { min, max } = AUDIT.walkthroughMinutes;

    expect(deliverables).toMatch(/inventory[^.]*model[^.]*firmware[^.]*end-of-life[^.]*support status/i);
    expect(deliverables).toMatch(/network diagram/i);
    expect(deliverables).toMatch(/risk-ranked findings[^.]*fix-cost estimates/i);
    expect(deliverables).toMatch(new RegExp(`${min}–${max}[- ]minute walkthrough`, "i"));
  });

  it("says plainly the report is the Audit Client's to keep, whether or not they hire Akimbo", () => {
    expect(text(audit().html)).toMatch(/report is yours to keep, whether or not you hire us/i);
  });

  it("credits the full fee against first Plan invoices or a project, within the credit window", () => {
    const after = text(region(audit(), "After the audit"));

    expect(after).toMatch(/full fee is credited/i);
    expect(after).toMatch(/first Plan invoices/i);
    expect(after).toMatch(/project quoted from the audit/i);
    expect(after).toContain(`within ${AUDIT.creditWindowDays} days`);
  });

  it("says the inventory comes with the report and goes live in the Client Portal on a Plan", () => {
    const after = text(region(audit(), "After the audit"));

    expect(after).toMatch(/inventory comes with (your|the) report/i);
    expect(after).toMatch(/live in the Client Portal[^.]*join a Plan/i);
  });

  it("shows no dollar amount the pricing module doesn't publish for the audit", () => {
    const known = new Set<number>([AUDIT.price, AUDIT.addOnFrom]);
    const shown = readableText(audit()).flatMap(dollarAmounts);

    expect(shown.filter((amount) => !known.has(amount))).toEqual([]);
  });

  it("puts the fixed price in the meta description", () => {
    const description = audit().html.querySelector('meta[name="description"]')?.getAttribute("content");

    expect(dollarAmounts(description ?? "")).toContain(AUDIT.price);
  });

  it("says prices are in USD, exclude sales tax, and when they were set", () => {
    const content = text(audit().html);

    expect(content).toContain(CURRENCY);
    expect(content).toMatch(/excluding (any applicable )?sales tax/i);
    expect(content).toContain(`Prices as of ${pricesAsOfLabel()}`);
  });

  it("never runs a number into the next word", () => {
    expect(text(audit().html).match(/\d[a-z]{3,}/gi) ?? []).toEqual([]);
  });

  it("ends with a call to action to /contact", () => {
    const closing = { path: PATH, html: audit().html.querySelector("main")!.children.at(-1)! };

    expect(
      links(closing).some(
        (link) => link.text.startsWith("Book a network audit") && isSitePath(link.url, "/contact"),
      ),
    ).toBe(true);
  });
});
