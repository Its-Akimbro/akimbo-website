import { describe, expect, it } from "vitest";
import { postmarkCalls, site, submit, submitForErrors, without } from "./contact-requests";

const validAudit = {
  kind: "audit",
  name: "Ada Lovelace",
  business: "Analytical Engines Ltd",
  email: "ada@example.com",
  town: "Raleigh",
  devices: "10to25",
  "cf-turnstile-response": "token-from-widget",
};

describe("POST /api/contact, audit request", () => {
  it("sends one email and redirects to the confirmation page", async () => {
    const harness = site();

    const response = await submit(harness, validAudit);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://akimbo.technology/contact/thanks/");
    expect(postmarkCalls(harness)).toHaveLength(1);
  });
});

describe("audit validation", () => {
  it("requires name, business, email, town and devices", async () => {
    const harness = site();

    const { status, body } = await submitForErrors(
      harness,
      without(validAudit, "name", "business", "email", "town", "devices"),
    );

    expect(status).toBe(422);
    expect(body).toEqual({
      errors: {
        name: "Enter your name.",
        business: "Enter the business name.",
        email: "Enter your email address.",
        town: "Enter the town or city the site is in.",
        devices: "Choose roughly how many infrastructure devices the site has.",
      },
    });
    expect(harness.upstreamRequests).toHaveLength(0);
  });

  it.each(["lt10", "10to25", "gt25"])("accepts the device count %j", async (devices) => {
    const response = await submit(site(), { ...validAudit, devices });

    expect(response.status).toBe(303);
  });

  it.each(["10", "gt100", "LT10", "under 10"])(
    "rejects a device count that isn't on the allow-list: %j",
    async (devices) => {
      const harness = site();

      const { status, body } = await submitForErrors(harness, { ...validAudit, devices });

      expect(status).toBe(422);
      expect(body.errors).toEqual({
        devices: "Choose roughly how many infrastructure devices the site has.",
      });
      expect(harness.upstreamRequests).toHaveLength(0);
    },
  );

  it("caps field lengths", async () => {
    const harness = site();

    const { status, body } = await submitForErrors(harness, {
      ...validAudit,
      name: "a".repeat(101),
      business: "b".repeat(151),
      email: `${"a".repeat(243)}@example.com`, // 255 characters
      town: "t".repeat(101),
      phone: "1".repeat(41),
      timing: "w".repeat(201),
      notes: "n".repeat(5001),
    });

    expect(status).toBe(422);
    expect(body.errors).toEqual({
      name: "Keep your name to 100 characters or fewer.",
      business: "Keep the business name to 150 characters or fewer.",
      email: "Keep your email address to 254 characters or fewer.",
      town: "Keep the town or city to 100 characters or fewer.",
      phone: "Keep your phone number to 40 characters or fewer.",
      timing: "Keep your preferred timing to 200 characters or fewer.",
      notes: "Keep your notes to 5,000 characters or fewer.",
    });
    expect(harness.upstreamRequests).toHaveLength(0);
  });

  it("accepts every optional field, at its length cap", async () => {
    const response = await submit(site(), {
      ...validAudit,
      phone: "1".repeat(40),
      timing: "w".repeat(200),
      notes: "n".repeat(5000),
      service: "managed-networking",
    });

    expect(response.status).toBe(303);
  });

  it("rejects a referring service that isn't on the allow-list", async () => {
    const harness = site();

    const { status, body } = await submitForErrors(harness, {
      ...validAudit,
      service: "web-design",
    });

    expect(status).toBe(422);
    expect(body.errors).toEqual({ service: "Choose a service from the list." });
    expect(harness.upstreamRequests).toHaveLength(0);
  });
});

describe("the audit email", () => {
  it("is tagged [Audit] and labels every field, flagging a site over the audit limit", async () => {
    const harness = site();

    await submit(harness, {
      ...validAudit,
      devices: "gt25",
      phone: "+1 919 555 0100",
      timing: "Weekday mornings in December",
      notes: "Two comms cupboards.\nThe firewall is out of support.",
      service: "network-audit",
      // Unknown fields are ignored, so input can never choose the recipient.
      to: "attacker@example.com",
    });

    const calls = postmarkCalls(harness);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://api.postmarkapp.com/email");
    expect(await calls[0].json()).toEqual({
      MessageStream: "enquiries",
      From: "Akimbo Technology website <enquiries@notify.akimbo.technology>",
      To: "hello@akimbo.technology",
      ReplyTo: "ada@example.com",
      Subject: "[Audit] Ada Lovelace, Analytical Engines Ltd, Raleigh",
      TextBody: [
        "Network Audit request from the website contact form.",
        "",
        "Name: Ada Lovelace",
        "Business: Analytical Engines Ltd",
        "Email: ada@example.com",
        "Phone: +1 919 555 0100",
        "Site town/city: Raleigh",
        "Infrastructure devices: More than 25",
        "Over the 25-device audit limit: Yes, quote the add-on",
        "Preferred timing: Weekday mornings in December",
        "Referring service: Network audit (network-audit)",
        "Notes:",
        "  Two comms cupboards.",
        "  The firewall is out of support.",
        "",
      ].join("\n"),
      TrackOpens: false,
      TrackLinks: "None",
    });
  });

  it.each([
    ["lt10", "Under 10"],
    ["10to25", "10–25"],
  ])("says a site with devices=%s is within the audit limit", async (devices, label) => {
    const harness = site();

    await submit(harness, { ...validAudit, devices });

    const { TextBody } = await postmarkCalls(harness)[0].json();
    expect(TextBody).toContain(`\nInfrastructure devices: ${label}\n`);
    expect(TextBody).toContain("\nOver the 25-device audit limit: No\n");
  });

  it("labels optional fields the submitter left blank", async () => {
    const harness = site();

    await submit(harness, validAudit);

    const { TextBody } = await postmarkCalls(harness)[0].json();
    expect(TextBody).toContain("\nPhone: (not given)\n");
    expect(TextBody).toContain("\nPreferred timing: (not given)\n");
    expect(TextBody).toContain("\nReferring service: (not given)\n");
    expect(TextBody).toContain("\nNotes: (not given)\n");
  });

  it("neutralises header and body injection", async () => {
    const harness = site();

    await submit(harness, {
      ...validAudit,
      name: "Ada\r\nBcc: victim@example.com",
      town: "Raleigh\nEmail: spoofed@example.com",
      timing: "Soon\nName: Someone Else",
      notes: "Hi\nBusiness: Evil Co",
    });

    const { To, Subject, TextBody, ...rest } = await postmarkCalls(harness)[0].json();
    expect(To).toBe("hello@akimbo.technology");
    expect(rest).not.toHaveProperty("Bcc");
    expect(Subject).toBe(
      "[Audit] Ada Bcc: victim@example.com, Analytical Engines Ltd, Raleigh Email: spoofed@example.com",
    );
    expect(TextBody).toContain("\nNotes:\n  Hi\n  Business: Evil Co\n");
    for (const label of ["Name", "Email", "Business"]) {
      expect(TextBody.match(new RegExp(`^${label}: `, "gm")), label).toHaveLength(1);
    }
  });
});
