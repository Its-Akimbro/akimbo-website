import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HarnessOptions } from "./harness";
import {
  POSTMARK,
  postmarkCalls,
  site,
  submit,
  submitForErrors,
  TURNSTILE,
  turnstile,
  without,
} from "./contact-requests";

const validEnquiry = {
  kind: "enquiry",
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Can you look after our office network?",
  "cf-turnstile-response": "token-from-widget",
};

describe("POST /api/contact, general enquiry", () => {
  it("sends one email and redirects to the confirmation page", async () => {
    const harness = site();

    const response = await submit(harness, validEnquiry);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://akimbo.technology/contact/thanks/");
    expect(postmarkCalls(harness)).toHaveLength(1);
  });

  it("accepts a multipart form post", async () => {
    const harness = site();
    const body = new FormData();
    for (const [name, value] of Object.entries(validEnquiry)) body.append(name, value);

    const response = await harness.fetch("https://akimbo.technology/api/contact", {
      method: "POST",
      body,
    });

    expect(response.status).toBe(303);
    expect(postmarkCalls(harness)).toHaveLength(1);
  });

  it("answers a client that asks for JSON with 200 JSON", async () => {
    const harness = site();

    const response = await submit(harness, validEnquiry, { accept: "application/json" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(postmarkCalls(harness)).toHaveLength(1);
  });
});

describe("enquiry validation", () => {
  it("requires name, email and message", async () => {
    const harness = site();

    const { status, body } = await submitForErrors(
      harness,
      without(validEnquiry, "name", "email", "message"),
    );

    expect(status).toBe(422);
    expect(body).toEqual({
      errors: {
        name: "Enter your name.",
        email: "Enter your email address.",
        message: "Enter a message.",
      },
    });
    expect(harness.upstreamRequests).toHaveLength(0);
  });

  it("treats whitespace-only fields as missing", async () => {
    const { status, body } = await submitForErrors(site(), { ...validEnquiry, name: "   " });

    expect(status).toBe(422);
    expect(body.errors).toEqual({ name: "Enter your name." });
  });

  it("treats a field of only control characters as missing", async () => {
    const harness = site();

    const { status, body } = await submitForErrors(harness, {
      ...validEnquiry,
      name: "\u0001\u0007",
      message: "\u0000\u001b",
    });

    expect(status).toBe(422);
    expect(body.errors).toEqual({ name: "Enter your name.", message: "Enter a message." });
    expect(harness.upstreamRequests).toHaveLength(0);
  });

  it("caps field lengths", async () => {
    const harness = site();

    const { status, body } = await submitForErrors(harness, {
      ...validEnquiry,
      name: "a".repeat(101),
      email: `${"a".repeat(243)}@example.com`, // 255 characters
      business: "b".repeat(151),
      message: "m".repeat(5001),
    });

    expect(status).toBe(422);
    expect(body.errors).toEqual({
      name: "Keep your name to 100 characters or fewer.",
      email: "Keep your email address to 254 characters or fewer.",
      business: "Keep the business name to 150 characters or fewer.",
      message: "Keep your message to 5,000 characters or fewer.",
    });
    expect(harness.upstreamRequests).toHaveLength(0);
  });

  it("accepts fields at their length caps", async () => {
    const harness = site();

    const response = await submit(harness, {
      ...validEnquiry,
      name: "a".repeat(100),
      email: `${"a".repeat(242)}@example.com`, // 254 characters
      business: "b".repeat(150),
      message: "m".repeat(5000),
    });

    expect(response.status).toBe(303);
  });

  it("counts a submitted CRLF line break as one character, as the browser's maxlength does", async () => {
    const response = await submit(site(), {
      ...validEnquiry,
      message: `${"m".repeat(2499)}\r\n${"m".repeat(2500)}`, // 5,000 characters in the textarea
    });

    expect(response.status).toBe(303);
  });

  it.each([
    "ada",
    "ada@",
    "@example.com",
    "ada@example",
    "ada@-example.com",
    "ada@example-.com",
    "ada@example..com",
    "ada lovelace@example.com",
    "ada@example.com, eve@example.com",
    "Ada <ada@example.com>",
    "ada@example.com\r\nBcc: eve@example.com",
  ])("rejects the email address %j", async (email) => {
    const harness = site();

    const { status, body } = await submitForErrors(harness, { ...validEnquiry, email });

    expect(status).toBe(422);
    expect(body.errors).toEqual({ email: "Enter an email address like name@example.com." });
    expect(harness.upstreamRequests).toHaveLength(0);
  });

  it.each(["ada.lovelace+web@mail.example.co.uk", "o'brien@example.ie"])(
    "accepts the email address %j",
    async (email) => {
      const response = await submit(site(), { ...validEnquiry, email });

      expect(response.status).toBe(303);
    },
  );

  it("accepts every allow-listed service", async () => {
    for (const service of [
      "network-audit",
      "managed-networking",
      "servers-virtualisation",
      "network-projects",
    ]) {
      const response = await submit(site(), { ...validEnquiry, service });
      expect(response.status, service).toBe(303);
    }
  });

  it("rejects a service that isn't on the allow-list", async () => {
    const harness = site();

    const { status, body } = await submitForErrors(harness, {
      ...validEnquiry,
      service: "web-design",
    });

    expect(status).toBe(422);
    expect(body.errors).toEqual({ service: "Choose a service from the list." });
    expect(harness.upstreamRequests).toHaveLength(0);
  });

  it.each([undefined, "", "newsletter"])("rejects the form kind %j", async (kind) => {
    const harness = site();
    const fields = kind === undefined ? without(validEnquiry, "kind") : { ...validEnquiry, kind };

    const { status, body } = await submitForErrors(harness, fields);

    expect(status).toBe(422);
    expect(body.errors).toHaveProperty("kind");
    expect(harness.upstreamRequests).toHaveLength(0);
  });

  it("shows a browser form post its errors as a page", async () => {
    const response = await submit(site(), without(validEnquiry, "message"));

    expect(response.status).toBe(422);
    expect(response.headers.get("content-type")).toMatch(/^text\/html/);
    const page = await response.text();
    expect(page).toContain("Enter a message.");
    expect(page).toContain('href="mailto:hello@akimbo.technology"');
  });
});

describe("spam protection", () => {
  it("answers a filled honeypot with the success response and sends nothing", async () => {
    const harness = site();

    const response = await submit(harness, { ...validEnquiry, website: "https://spam.example" });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://akimbo.technology/contact/thanks/");
    expect(harness.upstreamRequests).toHaveLength(0);
  });

  it("answers a filled honeypot with success even when other fields are invalid", async () => {
    const harness = site();

    const response = await submit(harness, { website: "x", email: "not-an-email" });

    expect(response.status).toBe(303);
    expect(harness.upstreamRequests).toHaveLength(0);
  });

  it("verifies the Turnstile token with siteverify using the Worker secret", async () => {
    const harness = site();

    await submit(harness, validEnquiry, { "cf-connecting-ip": "203.0.113.7" });

    const [verify] = harness.upstreamRequests.filter((r) => new URL(r.url).origin === TURNSTILE);
    expect(verify.method).toBe("POST");
    expect(verify.url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    const params = Object.fromEntries(await verify.formData());
    expect(params).toEqual({
      secret: "test-turnstile-secret",
      response: "token-from-widget",
      remoteip: "203.0.113.7",
    });
  });

  it("gives a failed Turnstile check a 422 and sends nothing", async () => {
    const harness = site({ [TURNSTILE]: turnstile(false) });

    const { status, body } = await submitForErrors(harness, validEnquiry);

    expect(status).toBe(422);
    expect(body.errors).toEqual({
      turnstile: "We couldn't confirm you're not a bot. Please try again.",
    });
    expect(postmarkCalls(harness)).toHaveLength(0);
  });

  it("gives a missing Turnstile token a 422 without calling siteverify", async () => {
    const harness = site();

    const { status, body } = await submitForErrors(
      harness,
      without(validEnquiry, "cf-turnstile-response"),
    );

    // Turnstile needs JavaScript, so a visitor with it all switched off can't
    // retry their way through: point them at email instead.
    expect(status).toBe(422);
    expect(body.errors).toEqual({
      turnstile:
        "We couldn't run our spam check, which needs JavaScript. Please email hello@akimbo.technology instead.",
    });
    expect(harness.upstreamRequests).toHaveLength(0);
  });

  it("puts the email fallback first on the page a no-JavaScript visitor sees", async () => {
    const response = await submit(site(), without(validEnquiry, "cf-turnstile-response"));

    const page = await response.text();
    expect(page.indexOf('href="mailto:hello@akimbo.technology"')).toBeGreaterThan(-1);
    expect(page.indexOf('href="mailto:hello@akimbo.technology"')).toBeLessThan(
      page.indexOf('href="/contact/"'),
    );
  });

  it("checks the fields before spending the Turnstile token", async () => {
    const harness = site();

    await submitForErrors(harness, without(validEnquiry, "message"));

    expect(harness.upstreamRequests).toHaveLength(0);
  });
});

describe("when a service fails", () => {
  const failures: [string, HarnessOptions["upstreams"]][] = [
    ["Postmark returns a server error", { [POSTMARK]: () => new Response("oops", { status: 500 }) }],
    [
      "Postmark rejects the email",
      {
        [POSTMARK]: () =>
          Response.json({ ErrorCode: 300, Message: "Invalid email request" }, { status: 422 }),
      },
    ],
    [
      "Postmark can't be reached",
      {
        [POSTMARK]: () => {
          throw new TypeError("fetch failed");
        },
      },
    ],
    ["siteverify returns a server error", { [TURNSTILE]: () => new Response("", { status: 503 }) }],
    [
      "siteverify can't be reached",
      {
        [TURNSTILE]: () => {
          throw new TypeError("fetch failed");
        },
      },
    ],
  ];

  it.each(failures)("gives a 502 with the mailto fallback when %s", async (_, upstreams) => {
    const harness = site(upstreams);

    const response = await submit(harness, validEnquiry, { accept: "application/json" });

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "We couldn't send your enquiry. Please email hello@akimbo.technology instead.",
      mailto: "mailto:hello@akimbo.technology",
    });
  });

  it("sends nothing when siteverify fails", async () => {
    const harness = site({ [TURNSTILE]: () => new Response("", { status: 503 }) });

    await submit(harness, validEnquiry);

    expect(postmarkCalls(harness)).toHaveLength(0);
  });

  it("shows a browser form post the mailto fallback as a page", async () => {
    const harness = site({ [POSTMARK]: () => new Response("oops", { status: 500 }) });

    const response = await submit(harness, validEnquiry);

    expect(response.status).toBe(502);
    expect(response.headers.get("content-type")).toMatch(/^text\/html/);
    expect(await response.text()).toContain('href="mailto:hello@akimbo.technology"');
  });
});

describe("logging", () => {
  let logged: string[];

  beforeEach(() => {
    logged = [];
    for (const level of ["log", "info", "warn", "error", "debug"] as const) {
      vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
        logged.push(args.map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg))).join(" "));
      });
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs the Postmark message ID and the outcome of a sent enquiry", async () => {
    await submit(site(), validEnquiry);

    expect(logged.map((line) => JSON.parse(line))).toEqual([
      { route: "/api/contact", outcome: "sent", messageId: "b7bc2f4a-e38e-4336-af7d-e6c392c2f817" },
    ]);
  });

  it.each<[string, HarnessOptions["upstreams"], Record<string, string>]>([
    ["sent", {}, {}],
    ["honeypot", {}, { website: "spam" }],
    ["invalid", {}, { email: "nope" }],
    ["turnstile failed", { [TURNSTILE]: turnstile(false) }, {}],
    ["turnstile error", { [TURNSTILE]: () => new Response("", { status: 500 }) }, {}],
    [
      "postmark error",
      {
        [POSTMARK]: () =>
          Response.json({ ErrorCode: 300, Message: "Invalid 'ReplyTo' address: ada-secret@example.com" }, { status: 422 }),
      },
      {},
    ],
  ])("logs no field values when the outcome is %s", async (_, upstreams, overrides) => {
    const fields = {
      ...validEnquiry,
      name: "Ada-secret Lovelace",
      email: "ada-secret@example.com",
      business: "Secret Engines Ltd",
      message: "secret message",
      ...overrides,
    };

    await submit(site(upstreams), fields);

    expect(logged.length).toBeGreaterThan(0);
    const values = Object.entries(fields)
      .filter(([name]) => name !== "kind")
      .map(([, value]) => value);
    for (const line of logged) {
      for (const value of values) expect(line).not.toContain(value);
    }
  });
});

describe("other requests to /api/contact", () => {
  it.each(["GET", "PUT", "DELETE"])("rejects %s", async (method) => {
    const harness = site();

    const response = await harness.fetch("https://akimbo.technology/api/contact", { method });

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
    expect(harness.upstreamRequests).toHaveLength(0);
    expect(harness.assetRequests).toHaveLength(0);
  });

  it("rejects a body that isn't a form post", async () => {
    const harness = site();

    const response = await harness.fetch("https://akimbo.technology/api/contact", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "name=Ada",
    });

    expect(response.status).toBe(415);
    expect(harness.upstreamRequests).toHaveLength(0);
  });
});

describe("the enquiry email", () => {
  it("goes to hello@ on the enquiry stream, replying to the submitter, with every field labelled", async () => {
    const harness = site();

    await submit(harness, {
      ...validEnquiry,
      business: "Analytical Engines Ltd",
      service: "managed-networking",
      message: "Can you look after our office network?\nWe have two sites.",
      // Unknown fields are ignored, so input can never choose the recipient.
      to: "attacker@example.com",
    });

    const [call] = postmarkCalls(harness);
    expect(call.method).toBe("POST");
    expect(call.url).toBe("https://api.postmarkapp.com/email");
    expect(call.headers.get("x-postmark-server-token")).toBe("test-postmark-token");
    expect(await call.json()).toEqual({
      MessageStream: "enquiries",
      From: "Akimbo Technology website <enquiries@notify.akimbo.technology>",
      To: "hello@akimbo.technology",
      ReplyTo: "ada@example.com",
      Subject: "[Enquiry] Ada Lovelace, Analytical Engines Ltd",
      TextBody: [
        "General enquiry from the website contact form.",
        "",
        "Name: Ada Lovelace",
        "Email: ada@example.com",
        "Business: Analytical Engines Ltd",
        "Service: Managed networking (managed-networking)",
        "Message:",
        "  Can you look after our office network?",
        "  We have two sites.",
        "",
      ].join("\n"),
      TrackOpens: false,
      TrackLinks: "None",
    });
  });

  it("labels optional fields the submitter left blank", async () => {
    const harness = site();

    await submit(harness, validEnquiry);

    const { Subject, TextBody } = await postmarkCalls(harness)[0].json();
    expect(Subject).toBe("[Enquiry] Ada Lovelace");
    expect(TextBody).toContain("Business: (not given)\n");
    expect(TextBody).toContain("Service: (not given)\n");
  });

  it("neutralises header and body injection", async () => {
    const harness = site();

    await submit(harness, {
      ...validEnquiry,
      name: "Ada\r\nBcc: victim@example.com",
      business: "Evil\nCo",
      message: "Hi\r\nEmail: spoofed@example.com\n\nName: Someone Else",
    });

    const { To, Subject, TextBody, ...rest } = await postmarkCalls(harness)[0].json();
    expect(To).toBe("hello@akimbo.technology");
    expect(rest).not.toHaveProperty("Bcc");
    expect(Subject).toBe("[Enquiry] Ada Bcc: victim@example.com, Evil Co");
    expect(TextBody).toContain("\nName: Ada Bcc: victim@example.com\n");
    expect(TextBody).toContain("\nBusiness: Evil Co\n");
    // Message lines are indented, so they can't pass for a field label.
    expect(TextBody).toContain(
      "\nMessage:\n  Hi\n  Email: spoofed@example.com\n  \n  Name: Someone Else\n",
    );
    expect(TextBody.match(/^Name: /gm)).toHaveLength(1);
    expect(TextBody.match(/^Email: /gm)).toHaveLength(1);
  });
});
