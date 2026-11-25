import { describe, expect, it } from "vitest";
import {
  AUDIT,
  HOURLY,
  PLAN_BASIS,
  planQuote,
  pricesAsOfLabel,
  SERVER_ADDONS,
  TIERS,
  WORKED_EXAMPLE,
} from "../../src/pricing";
import { dollarAmounts, page, region, text } from "./dist";

const plans = () => page("/plans/");
const workedQuote = planQuote(WORKED_EXAMPLE.plan);

/** Every dollar amount /plans should publish, all from the pricing module. */
const PUBLISHED = [
  ...TIERS.map((tier) => tier.fromPerSite),
  PLAN_BASIS.perExtraDevice,
  PLAN_BASIS.perExtraSite,
  SERVER_ADDONS.perExtraServer,
  SERVER_ADDONS.perVm,
  HOURLY.standard,
  HOURLY.onPlan,
];

describe("/plans", () => {
  it("shows every tier's from price, add-on price and hourly rate from the pricing module", () => {
    const content = text(plans().html);
    const shown = new Set(dollarAmounts(content));

    expect(PUBLISHED.filter((amount) => !shown.has(amount))).toEqual([]);
  });

  it("shows each tier with its own from price", () => {
    const tiers = text(region(plans(), "The tiers"));

    for (const tier of TIERS) {
      expect(tiers).toContain(`${tier.name} From $${tier.fromPerSite} `);
    }
  });

  it("never runs a number into the next word", () => {
    // e.g. "within 10business days", where a template expression ate a space.
    expect(text(plans().html).match(/\d[a-z]{3,}/gi) ?? []).toEqual([]);
  });

  it("shows no dollar amount the pricing module doesn't publish", () => {
    const known = new Set([
      ...PUBLISHED,
      AUDIT.price,
      AUDIT.addOnFrom,
      ...workedQuote.lines.map((line) => line.amount),
      workedQuote.total,
    ]);

    const unknown = dollarAmounts(text(plans().html)).filter((amount) => !known.has(amount));

    expect(unknown).toEqual([]);
  });

  it("shows a worked example whose line items add up to its total, about $920", () => {
    const example = region(plans(), "Worked example");
    const lastCellAmount = (row: ReturnType<typeof example.querySelector>) =>
      dollarAmounts(text(row!.querySelectorAll("td, th").at(-1)!))[0];

    const lines = example.querySelectorAll("tbody tr").map(lastCellAmount);
    const total = lastCellAmount(example.querySelector("tfoot tr"));

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.reduce((sum, amount) => sum + amount, 0)).toBe(total);
    expect(total).toBe(workedQuote.total);
    expect(total).toBeGreaterThanOrEqual(900);
    expect(total).toBeLessThanOrEqual(940);
  });

  it("says prices are in USD, exclude sales tax, and when they were set", () => {
    const content = text(plans().html);

    expect(content).toContain("USD");
    expect(content).toMatch(/excluding (any applicable )?sales tax/i);
    expect(content).toContain(`Prices as of ${pricesAsOfLabel()}`);
  });
});
