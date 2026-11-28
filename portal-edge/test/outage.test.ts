import { describe, expect, it } from "vitest";
import { createHarness } from "./harness";

const unreachable = () => {
  throw new TypeError("Network connection lost.");
};

describe("an unreachable origin", () => {
  it("gets the branded 503, never cached, with Retry-After", async () => {
    const edge = createHarness(unreachable);

    const response = await edge.fetch("https://portal.akimbo.technology/sites/");

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("300");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(await response.text()).toContain("Client Portal temporarily unavailable");
  });
});

describe("Cloudflare's origin errors", () => {
  it.each([
    // cloudflared's answer when the tunnel is up but the portal guest isn't,
    // as in the monthly maintenance window.
    [502, "Bad Gateway"],
    // Cloudflare's answer when no tunnel connector is connected (the house
    // is down): status 530 with error 1033 in the body.
    [530, "error code: 1033"],
  ])("replaces a %i (%s) with the branded 503", async (status, body) => {
    const edge = createHarness(
      () =>
        new Response(body, {
          status,
          headers: { "content-type": "text/plain; charset=UTF-8", "cache-control": "max-age=60" },
        }),
    );

    const response = await edge.fetch("https://portal.akimbo.technology/");

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("300");
    expect(response.headers.get("cache-control")).toBe("no-store");
    const text = await response.text();
    expect(text).toContain("Client Portal temporarily unavailable");
    expect(text).not.toContain(body);
  });
});
