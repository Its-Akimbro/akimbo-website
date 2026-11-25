import { describe, expect, it } from "vitest";
import { createHarness } from "./harness";

describe("www host", () => {
  it("redirects to the same path and query on the apex", async () => {
    const site = createHarness();

    const response = await site.fetch(
      "https://www.akimbo.technology/plans?ref=card",
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://akimbo.technology/plans?ref=card",
    );
    expect(site.assetRequests).toHaveLength(0);
  });

  it("keeps the method and body when redirecting a POST", async () => {
    const site = createHarness();

    const response = await site.fetch("https://www.akimbo.technology/api/contact", {
      method: "POST",
      body: "name=Ada",
    });

    // 308, not 301: clients must re-send the same POST to the apex.
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://akimbo.technology/api/contact",
    );
  });
});

describe("apex host", () => {
  it("serves the built home page from static assets", async () => {
    const site = createHarness({
      assets: { "/": "<h1>Akimbo Technology</h1>" },
    });

    const response = await site.fetch("https://akimbo.technology/");

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("<h1>Akimbo Technology</h1>");
  });

  it("passes unknown paths through to static assets", async () => {
    const site = createHarness();

    const response = await site.fetch("https://akimbo.technology/nope");

    expect(response.status).toBe(404);
  });
});
