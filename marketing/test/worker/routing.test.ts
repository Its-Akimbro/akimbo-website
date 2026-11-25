import { describe, expect, it } from "vitest";
import { createHarness } from "./harness";

describe("www host", () => {
  it("redirects to the same path and query on the apex", async () => {
    const worker = createHarness();

    const response = await worker.fetch(
      "https://www.akimbo.technology/plans?ref=card",
    );

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(
      "https://akimbo.technology/plans?ref=card",
    );
    expect(worker.assetRequests).toHaveLength(0);
  });
});

describe("apex host", () => {
  it("serves the built home page from static assets", async () => {
    const worker = createHarness({
      assets: { "/": "<h1>Akimbo Technology</h1>" },
    });

    const response = await worker.fetch("https://akimbo.technology/");

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("<h1>Akimbo Technology</h1>");
  });

  it("passes unknown paths through to static assets", async () => {
    const worker = createHarness();

    const response = await worker.fetch("https://akimbo.technology/nope");

    expect(response.status).toBe(404);
  });
});
