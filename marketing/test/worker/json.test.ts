// /api/contact with a JSON body, as the enhanced contact page sends it (#40).
import { describe, expect, it } from "vitest";
import { POSTMARK, postmarkCalls, site, submitJson, TURNSTILE } from "./contact-requests";

const validEnquiry = {
  kind: "enquiry",
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Can you look after our office network?",
  "cf-turnstile-response": "token-from-widget",
};

const validAudit = {
  kind: "audit",
  name: "Ada Lovelace",
  business: "Analytical Engines Ltd",
  email: "ada@example.com",
  town: "Raleigh",
  devices: "gt25",
  "cf-turnstile-response": "token-from-widget",
};

describe("POST /api/contact with a JSON body", () => {
  it("sends a general enquiry and answers 200 JSON", async () => {
    const harness = site();

    const response = await submitJson(harness, validEnquiry);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    const emails = postmarkCalls(harness);
    expect(emails).toHaveLength(1);
    const { Subject, TextBody } = await emails[0].json();
    expect(Subject).toBe("[Enquiry] Ada Lovelace");
    expect(TextBody).toContain("\n  Can you look after our office network?\n");
  });

  it("sends an audit request and answers 200 JSON", async () => {
    const harness = site();

    const response = await submitJson(harness, validAudit);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    const emails = postmarkCalls(harness);
    expect(emails).toHaveLength(1);
    const { Subject, TextBody } = await emails[0].json();
    expect(Subject).toBe("[Audit] Ada Lovelace, Analytical Engines Ltd, Raleigh");
    expect(TextBody).toContain("\nInfrastructure devices: More than 25\n");
  });

  it("answers 422 JSON with per-field errors for an invalid enquiry", async () => {
    const harness = site();

    const response = await submitJson(harness, { ...validEnquiry, name: "", email: "ada" });

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      errors: {
        name: "Enter your name.",
        email: "Enter an email address like name@example.com.",
      },
    });
    expect(harness.upstreamRequests).toHaveLength(0);
  });

  it("answers 422 JSON with per-field errors for an invalid audit request", async () => {
    const harness = site();

    const response = await submitJson(harness, { ...validAudit, town: " ", devices: "lots" });

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      errors: {
        town: "Enter the town or city the site is in.",
        devices: "Choose roughly how many infrastructure devices the site has.",
      },
    });
    expect(harness.upstreamRequests).toHaveLength(0);
  });

  it("answers JSON to a JSON body even without an Accept header", async () => {
    const harness = site();

    const response = await harness.fetch("https://akimbo.technology/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validEnquiry),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("answers 502 JSON with the mailto fallback when Postmark is down", async () => {
    const harness = site({ [POSTMARK]: () => new Response("down", { status: 503 }) });

    const response = await submitJson(harness, validEnquiry);

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "We couldn't send your enquiry. Please email hello@akimbo.technology instead.",
      mailto: "mailto:hello@akimbo.technology",
    });
  });

  it("treats a non-string value as missing", async () => {
    const harness = site({ [TURNSTILE]: () => Response.json({ success: true }) });

    const response = await submitJson(harness, { ...validEnquiry, name: ["Ada"], message: 42 });

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      errors: { name: "Enter your name.", message: "Enter a message." },
    });
  });

  it.each([
    ["malformed JSON", "{not json"],
    ["a JSON array", JSON.stringify([validEnquiry])],
    ["a JSON string", JSON.stringify("hello")],
    ["JSON null", "null"],
  ])("rejects %s with 415 and sends nothing", async (_, body) => {
    const harness = site();

    const response = await harness.fetch("https://akimbo.technology/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body,
    });

    expect(response.status).toBe(415);
    expect(harness.upstreamRequests).toHaveLength(0);
  });
});
