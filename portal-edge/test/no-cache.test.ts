import { describe, expect, it } from "vitest";
import { createHarness } from "./harness";

describe("caching", () => {
  it("asks Cloudflare not to cache the origin's response", async () => {
    const edge = createHarness(
      () => new Response("body { color: navy }", { headers: { "content-type": "text/css" } }),
    );

    // A static-looking path is the kind Cloudflare would cache by default.
    await edge.fetch("https://portal.akimbo.technology/static/portal/app.css");

    expect(edge.originRequests[0].cache).toBe("no-store");
  });

  it("never touches the Cache API, for a healthy origin or an outage", async () => {
    let up = true;
    const edge = createHarness(() => {
      if (!up) throw new TypeError("Network connection lost.");
      return new Response("ok");
    });

    await edge.fetch("https://portal.akimbo.technology/");
    up = false;
    await edge.fetch("https://portal.akimbo.technology/");

    expect(edge.cacheCalls).toEqual([]);
  });
});
