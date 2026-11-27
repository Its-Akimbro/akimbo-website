import { describe, expect, it } from "vitest";
import { createHarness } from "./harness";

describe("a healthy origin", () => {
  it("passes a 200 through byte-for-byte, headers included", async () => {
    const body = new Uint8Array([0x3c, 0x68, 0x31, 0x3e, 0x00, 0xff, 0x0a]);
    const edge = createHarness(
      () =>
        new Response(body, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "private, no-cache",
            "set-cookie": "sessionid=abc; Secure; HttpOnly; SameSite=Lax",
            "x-frame-options": "DENY",
          },
        }),
    );

    const response = await edge.fetch("https://portal.akimbo.technology/sites/?page=2");

    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(body);
    expect(Object.fromEntries(response.headers)).toEqual({
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-cache",
      "set-cookie": "sessionid=abc; Secure; HttpOnly; SameSite=Lax",
      "x-frame-options": "DENY",
    });
  });
});

describe("responses that aren't an outage", () => {
  it("passes a redirect through instead of following it", async () => {
    const edge = createHarness(
      () => new Response(null, { status: 302, headers: { location: "/sign-in/?next=/sites/" } }),
    );

    const response = await edge.fetch("https://portal.akimbo.technology/sites/");

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/sign-in/?next=/sites/");
    expect(edge.originRequests[0].redirect).toBe("manual");
  });

  it.each([
    [400, "Bad request"],
    [403, "Forbidden"],
    [404, "Not found"],
    [429, "Too many attempts. Try again in a few minutes."],
    [500, "Server error"],
    [503, "Your data is temporarily unavailable"],
    [504, "Gateway timeout"],
  ])("passes the app's own %i through unchanged", async (status, text) => {
    const edge = createHarness(
      () =>
        new Response(text, {
          status,
          headers: { "content-type": "text/html; charset=utf-8", "x-portal": "1" },
        }),
    );

    const response = await edge.fetch("https://portal.akimbo.technology/");

    expect(response.status).toBe(status);
    expect(await response.text()).toBe(text);
    expect(Object.fromEntries(response.headers)).toEqual({
      "content-type": "text/html; charset=utf-8",
      "x-portal": "1",
    });
  });
});

describe("the forwarded request", () => {
  it("keeps the method, path, query, headers and body", async () => {
    const edge = createHarness(() => new Response(null, { status: 204 }));

    await edge.fetch("https://portal.akimbo.technology/sign-in/code/?next=%2Fsites%2F", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        cookie: "csrftoken=t0k3n",
      },
      body: "code=123456",
    });

    const [sent] = edge.originRequests;
    expect(sent.method).toBe("POST");
    expect(sent.url).toBe("https://portal.akimbo.technology/sign-in/code/?next=%2Fsites%2F");
    expect(sent.headers.get("cookie")).toBe("csrftoken=t0k3n");
    expect(await sent.text()).toBe("code=123456");
  });

  it.each([
    "https://0123abcd-akimbo-portal-edge.example.workers.dev/sites/?q=1",
    "http://localhost:8787/sites/?q=1",
  ])("goes to the portal over HTTPS even from %s", async (url) => {
    const edge = createHarness(() => new Response("ok"));

    await edge.fetch(url);

    expect(edge.originRequests[0].url).toBe("https://portal.akimbo.technology/sites/?q=1");
  });
});

describe("the visitor's address", () => {
  // On a Worker's request to its own zone, Cloudflare can fill the origin's
  // CF-Connecting-IP from X-Real-IP. The portal keys its rate limits and audit
  // log on that address, so a visitor must not choose it.
  it("replaces a client-sent X-Real-IP with the address Cloudflare saw", async () => {
    const edge = createHarness(() => new Response("ok"));

    await edge.fetch("https://portal.akimbo.technology/sign-in/", {
      headers: { "cf-connecting-ip": "203.0.113.7", "x-real-ip": "198.51.100.1" },
    });

    expect(edge.originRequests[0].headers.get("x-real-ip")).toBe("203.0.113.7");
  });

  it("drops a client-sent X-Real-IP when Cloudflare gave no address", async () => {
    const edge = createHarness(() => new Response("ok"));

    await edge.fetch("https://portal.akimbo.technology/", {
      headers: { "x-real-ip": "198.51.100.1" },
    });

    expect(edge.originRequests[0].headers.has("x-real-ip")).toBe(false);
  });
});
