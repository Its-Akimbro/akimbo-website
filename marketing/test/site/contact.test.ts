// The contact page's Book an audit and General enquiry forms, posted as a browser with no
// JavaScript would: the built HTML form (seam 2) submitted to the Worker's
// fetch handler (seam 1).
import { describe, expect, it } from "vitest";
import type { HTMLElement } from "node-html-parser";
import { createHarness } from "../worker/harness";
import { isSitePath, links, pages, servedFile, SITE_ORIGIN, type Page } from "./dist";

const TURNSTILE = "https://challenges.cloudflare.com";
const POSTMARK = "https://api.postmarkapp.com";

function page(path: string): Page {
  const found = pages().find((p) => p.path === path);
  if (!found) throw new Error(`No built page at ${path}`);
  return found;
}

/** The form under the heading with this text. */
function formTitled(p: Page, title: string): HTMLElement {
  const form = p.html
    .querySelectorAll("form")
    .find((f) =>
      f.querySelectorAll("h2, legend").some((h) => h.textContent.trim() === title),
    );
  if (!form) throw new Error(`No "${title}" form on ${p.path}`);
  return form;
}

/**
 * The name/value pairs a browser would submit for this form, after a visitor
 * types `typed` into the fields with those names. Everything else keeps its
 * default value, as it would if the visitor left it alone.
 */
function submission(form: HTMLElement, typed: Record<string, string>): URLSearchParams {
  const body = new URLSearchParams();
  for (const control of form.querySelectorAll("input[name], textarea[name], select[name]")) {
    const name = control.getAttribute("name")!;
    const type = (control.getAttribute("type") ?? "text").toLowerCase();
    if (["submit", "button", "reset", "image", "file"].includes(type)) continue;
    if ((type === "checkbox" || type === "radio") && !control.hasAttribute("checked")) continue;
    let value: string;
    if (control.tagName === "TEXTAREA") value = control.textContent;
    else if (control.tagName === "SELECT") {
      const options = control.querySelectorAll("option");
      const selected = options.find((o) => o.hasAttribute("selected")) ?? options[0];
      value = selected ? (selected.getAttribute("value") ?? selected.textContent.trim()) : "";
    } else value = control.getAttribute("value") ?? "";
    body.append(name, typed[name] ?? value);
  }
  return body;
}

/** Every named field a visitor must fill in. */
function requiredFields(form: HTMLElement): string[] {
  return form
    .querySelectorAll("[required]")
    .map((control) => control.getAttribute("name")!)
    .filter(Boolean);
}

function fakeServices() {
  return createHarness({
    upstreams: {
      [TURNSTILE]: () => Response.json({ success: true }),
      [POSTMARK]: () => Response.json({ ErrorCode: 0, MessageID: "id-1" }),
    },
  });
}

/** Post the form exactly as its markup says: method, action and encoding. */
function post(harness: ReturnType<typeof createHarness>, form: HTMLElement, body: URLSearchParams) {
  const action = new URL(form.getAttribute("action") ?? "", new URL("/contact/", SITE_ORIGIN));
  return harness.fetch(action.toString(), {
    method: (form.getAttribute("method") ?? "get").toUpperCase(),
    headers: {
      "content-type": form.getAttribute("enctype") ?? "application/x-www-form-urlencoded",
      accept: "text/html",
    },
    body,
  });
}

/** What a visitor types into the General enquiry form's required fields. */
const VISITOR = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Can you look after our office network?",
};

/** The form with the hidden input the Turnstile widget adds when its script runs. */
function withWidgetToken(body: URLSearchParams): URLSearchParams {
  body.set("cf-turnstile-response", "token-from-widget");
  return body;
}

describe("/contact General enquiry form", () => {
  it("asks for name, email and message", () => {
    const form = formTitled(page("/contact/"), "General enquiry");

    expect(requiredFields(form).sort()).toEqual(["email", "message", "name"]);
  });

  it("sends an enquiry when posted without JavaScript and lands on a confirmation page", async () => {
    const form = formTitled(page("/contact/"), "General enquiry");
    const harness = fakeServices();

    const response = await post(harness, form, withWidgetToken(submission(form, VISITOR)));

    expect(response.status).toBe(303);
    const emails = harness.upstreamRequests.filter((r) => r.url.startsWith(POSTMARK));
    expect(emails).toHaveLength(1);
    const { TextBody } = await emails[0].json();
    expect(TextBody).toContain("Name: Ada Lovelace");

    const confirmation = new URL(response.headers.get("location")!);
    expect(servedFile(confirmation.pathname)).toBeDefined();
    const thanks = page(confirmation.pathname);
    expect(thanks.html.querySelector("main")!.textContent).toMatch(/one business day/i);
  });

  it("offers only services the Worker accepts", async () => {
    const form = formTitled(page("/contact/"), "General enquiry");
    const options = form
      .querySelectorAll('select[name="service"] option')
      .map((o) => o.getAttribute("value") ?? "");

    expect(options.filter(Boolean).length).toBeGreaterThan(0);
    for (const service of options) {
      const harness = fakeServices();
      const response = await post(
        harness,
        form,
        withWidgetToken(submission(form, { ...VISITOR, service })),
      );
      expect(response.status, `service=${service}`).toBe(303);
    }
  });

  it("sends nothing when a bot fills in every field, including the hidden one", async () => {
    const form = formTitled(page("/contact/"), "General enquiry");
    const everything = Object.fromEntries(
      [...submission(form, {}).keys()].map((name) => [name, "spam"]),
    );
    const harness = fakeServices();

    const response = await post(
      harness,
      form,
      withWidgetToken(submission(form, { ...everything, ...VISITOR, service: "" })),
    );

    expect(response.status).toBe(303);
    expect(harness.upstreamRequests).toHaveLength(0);
  });

  it("has a Turnstile widget", () => {
    const form = formTitled(page("/contact/"), "General enquiry");

    expect(form.querySelector(".cf-turnstile[data-sitekey]")).not.toBeNull();
  });

  it("links to the Privacy Policy from the form", () => {
    const contact = page("/contact/");
    const form = formTitled(contact, "General enquiry");
    const formLinks = links({ path: contact.path, html: form });

    expect(formLinks.some((l) => l.text === "Privacy Policy" && isSitePath(l.url, "/privacy"))).toBe(
      true,
    );
  });
});

/** What a visitor types into the Book an audit form's required fields. */
const AUDIT_VISITOR = {
  name: "Ada Lovelace",
  business: "Analytical Engines Ltd",
  email: "ada@example.com",
  town: "Raleigh",
};

describe("/contact Book an audit form", () => {
  it("asks for name, business name, email, town or city and device count", () => {
    const form = formTitled(page("/contact/"), "Book an audit");

    expect(requiredFields(form).sort()).toEqual(["business", "devices", "email", "name", "town"]);
  });

  it("books an audit when posted without JavaScript and lands on a confirmation page", async () => {
    const form = formTitled(page("/contact/"), "Book an audit");
    const harness = fakeServices();

    const response = await post(
      harness,
      form,
      withWidgetToken(
        submission(form, {
          ...AUDIT_VISITOR,
          devices: "gt25",
          phone: "+1 919 555 0100",
          timing: "Weekday mornings",
          notes: "Two comms cupboards.",
        }),
      ),
    );

    expect(response.status).toBe(303);
    expect(servedFile(new URL(response.headers.get("location")!).pathname)).toBeDefined();
    const emails = harness.upstreamRequests.filter((r) => r.url.startsWith(POSTMARK));
    expect(emails).toHaveLength(1);
    const { Subject, TextBody } = await emails[0].json();
    expect(Subject).toMatch(/^\[Audit\] /);
    for (const line of [
      "Name: Ada Lovelace",
      "Business: Analytical Engines Ltd",
      "Email: ada@example.com",
      "Phone: +1 919 555 0100",
      "Site town/city: Raleigh",
      "Infrastructure devices: More than 25",
      "Over the 25-device audit limit: Yes, quote the add-on",
      "Preferred timing: Weekday mornings",
      "  Two comms cupboards.",
    ]) {
      expect(TextBody).toContain(`\n${line}\n`);
    }
  });

  it("offers only device counts the Worker accepts", async () => {
    const form = formTitled(page("/contact/"), "Book an audit");
    const options = form
      .querySelectorAll('select[name="devices"] option')
      .map((o) => o.getAttribute("value") ?? "")
      .filter(Boolean);

    expect(options.sort()).toEqual(["10to25", "gt25", "lt10"]);
    for (const devices of options) {
      const harness = fakeServices();
      const response = await post(
        harness,
        form,
        withWidgetToken(submission(form, { ...AUDIT_VISITOR, devices })),
      );
      expect(response.status, `devices=${devices}`).toBe(303);
    }
  });

  it("tells a visitor with more than 25 devices the add-on will be quoted", () => {
    const form = formTitled(page("/contact/"), "Book an audit");
    const text = form.textContent.replace(/\s+/g, " ");

    expect(text).toMatch(/more than 25, it's outside the standard audit and we'll quote the add-on/);
  });

  it("sends nothing when a bot fills in every field, including the hidden one", async () => {
    const form = formTitled(page("/contact/"), "Book an audit");
    const everything = Object.fromEntries(
      [...submission(form, {}).keys()].map((name) => [name, "spam"]),
    );
    const harness = fakeServices();

    const response = await post(
      harness,
      form,
      withWidgetToken(
        submission(form, { ...everything, ...AUDIT_VISITOR, devices: "lt10", service: "" }),
      ),
    );

    expect(response.status).toBe(303);
    expect(harness.upstreamRequests).toHaveLength(0);
  });

  it("has a Turnstile widget", () => {
    const form = formTitled(page("/contact/"), "Book an audit");

    expect(form.querySelector(".cf-turnstile[data-sitekey]")).not.toBeNull();
  });

  it("links to the Privacy Policy from the form", () => {
    const contact = page("/contact/");
    const form = formTitled(contact, "Book an audit");
    const formLinks = links({ path: contact.path, html: form });

    expect(formLinks.some((l) => l.text === "Privacy Policy" && isSitePath(l.url, "/privacy"))).toBe(
      true,
    );
  });
});

describe("/contact page", () => {
  it("has both forms, with no two controls sharing an id", () => {
    const contact = page("/contact/");
    formTitled(contact, "Book an audit");
    formTitled(contact, "General enquiry");

    const ids = contact.html.querySelectorAll("[id]").map((el) => el.id);
    expect(ids.length).toBe(new Set(ids).size);
  });
});

describe("/contact/thanks/", () => {
  it("is kept out of search results", () => {
    const thanks = page("/contact/thanks/");

    expect(thanks.html.querySelector('meta[name="robots"]')?.getAttribute("content")).toMatch(
      /noindex/,
    );
  });
});
