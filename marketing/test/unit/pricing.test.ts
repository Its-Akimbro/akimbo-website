import { describe, expect, it } from "vitest";
import { planQuote, WORKED_EXAMPLE } from "../../src/pricing";

describe("planQuote", () => {
  it("prices the published worked example at $920 a month", () => {
    // Ticket #14: 40-person office, 13 network devices, one virtualised host,
    // three VMs, on Managed + Servers: about $920/mo.
    const quote = planQuote(WORKED_EXAMPLE.plan);

    expect(quote.lines.map((line) => line.amount)).toEqual([575, 45, 300]);
    expect(quote.total).toBe(920);
  });

  it("gives each extra site its own device allowance at +$150", () => {
    // Managed $395 + one extra site $150 + 2 devices over the allowance at
    // the first site × $15. The second site is under its own allowance.
    const quote = planQuote({ tier: "managed", siteDevices: [12, 8], servers: 0, vms: 0 });

    expect(quote.total).toBe(575);
  });

  it("charges +$175 for each server beyond the one included", () => {
    // Managed + Servers $575 + 2 further servers × $175.
    const quote = planQuote({ tier: "managed-servers", siteDevices: [10], servers: 3, vms: 0 });

    expect(quote.total).toBe(925);
  });

  it("refuses servers or VMs on a tier that doesn't cover them", () => {
    expect(() =>
      planQuote({ tier: "managed", siteDevices: [10], servers: 1, vms: 0 }),
    ).toThrow(/Managed \+ Servers/);
    expect(() =>
      planQuote({ tier: "essentials", siteDevices: [10], servers: 0, vms: 2 }),
    ).toThrow(/Managed \+ Servers/);
  });

  it("leaves out line items that come to nothing", () => {
    const quote = planQuote({ tier: "essentials", siteDevices: [10], servers: 0, vms: 0 });

    expect(quote.lines).toHaveLength(1);
    expect(quote.total).toBe(175);
  });
});
