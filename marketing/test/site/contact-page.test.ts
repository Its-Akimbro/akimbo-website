// @vitest-environment happy-dom
// The /contact page with JavaScript on (#40): tabs, the ?service= preset,
// inline validation and in-page results. See ./contact-page.ts (seam 3).
import { describe, expect, it, vi } from "vitest";
import { SERVICES } from "../../src/services";
import {
  byRole,
  click,
  description,
  errorFor,
  field,
  fill,
  openContactPage,
  postmarkCalls,
  POSTMARK,
  press,
  solveTurnstile,
  TURNSTILE,
} from "./contact-page";
import { isSitePath, links, pages } from "./dist";

function tabs(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[role="tab"]')];
}

function panelOf(tab: HTMLElement): HTMLElement {
  return document.getElementById(tab.getAttribute("aria-controls")!)!;
}

describe("/contact tabs", () => {
  it("shows Book an audit and General enquiry as two tabs, Book an audit first", () => {
    openContactPage();

    const list = document.querySelector('[role="tablist"]')!;
    expect(list.getAttribute("aria-label")).toBe("Contact forms");
    expect(tabs().map((tab) => tab.textContent!.trim())).toEqual([
      "Book an audit",
      "General enquiry",
    ]);
    const [audit, enquiry] = tabs();
    expect(audit.getAttribute("aria-selected")).toBe("true");
    expect(enquiry.getAttribute("aria-selected")).toBe("false");
    expect(panelOf(audit).hidden).toBe(false);
    expect(panelOf(enquiry).hidden).toBe(true);
    expect(byRole("heading", "Book an audit")).toBeDefined();
    expect(() => byRole("heading", "General enquiry")).toThrow();
  });

  it("labels each panel by its tab", () => {
    openContactPage();

    expect(tabs()).toHaveLength(2);
    for (const tab of tabs()) {
      const panel = panelOf(tab);
      expect(panel.getAttribute("role")).toBe("tabpanel");
      expect(panel.getAttribute("aria-labelledby")).toBe(tab.id);
    }
  });

  it("switches tabs on click", () => {
    openContactPage();

    byRole("tab", "General enquiry").click();

    const [audit, enquiry] = tabs();
    expect(enquiry.getAttribute("aria-selected")).toBe("true");
    expect(audit.getAttribute("aria-selected")).toBe("false");
    expect(panelOf(enquiry).hidden).toBe(false);
    expect(panelOf(audit).hidden).toBe(true);
  });

  it("puts only the selected tab in the Tab order", () => {
    openContactPage();
    const [audit, enquiry] = tabs();

    expect([audit.tabIndex, enquiry.tabIndex]).toEqual([0, -1]);
    enquiry.click();
    expect([audit.tabIndex, enquiry.tabIndex]).toEqual([-1, 0]);
  });

  it("moves between tabs with the arrow, Home and End keys", () => {
    openContactPage();
    const [audit, enquiry] = tabs();
    audit.focus();

    press("ArrowRight");
    expect(document.activeElement).toBe(enquiry);
    expect(enquiry.getAttribute("aria-selected")).toBe("true");

    press("ArrowRight");
    expect(document.activeElement).toBe(audit);
    expect(audit.getAttribute("aria-selected")).toBe("true");

    press("ArrowLeft");
    expect(document.activeElement).toBe(enquiry);

    press("Home");
    expect(document.activeElement).toBe(audit);

    press("End");
    expect(document.activeElement).toBe(enquiry);
    expect(panelOf(enquiry).hidden).toBe(false);
  });
});

/** The hidden field that tells the Worker which service page an audit request came from. */
function auditReferrer(): string {
  return document.querySelector<HTMLInputElement>('#audit-panel input[name="service"]')!.value;
}

describe("/contact ?service= preset", () => {
  const servicePages = pages().filter((p) => p.path.startsWith("/services/") && p.path !== "/services/");
  const contactLinks = servicePages.flatMap((p) =>
    links(p, "main")
      .filter((l) => isSitePath(l.url, "/contact") && l.url.searchParams.has("service"))
      .map((l) => [p.path, l.url.search] as const),
  );

  it("is offered by every service page", () => {
    expect(servicePages.length).toBe(Object.keys(SERVICES).length);
    expect(new Set(contactLinks.map(([path]) => path)).size).toBe(servicePages.length);
  });

  it.each(contactLinks)("pre-fills the service when following the link on %s", (_, search) => {
    const slug = new URLSearchParams(search).get("service")!;
    openContactPage(search);

    expect(byRole("tab", "General enquiry").getAttribute("aria-selected")).toBe("true");
    const service = field("Service") as HTMLSelectElement;
    expect(service.value).toBe(slug);
    expect(service.selectedOptions[0].textContent).toBe(SERVICES[slug as keyof typeof SERVICES].name);
    expect(auditReferrer()).toBe(slug);
  });

  it.each(["?service=unknown-thing", "?service=constructor", "?service=", "?service=Network-Audit"])(
    "ignores %s",
    (search) => {
      openContactPage(search);

      expect(byRole("tab", "Book an audit").getAttribute("aria-selected")).toBe("true");
      byRole("tab", "General enquiry").click();
      expect(field("Service").value).toBe("");
      expect(auditReferrer()).toBe("");
    },
  );
});

describe("/contact inline validation", () => {
  it("shows each General enquiry error next to its field, and sends nothing", () => {
    const page = openContactPage();
    byRole("tab", "General enquiry").click();
    solveTurnstile();

    click("Send enquiry");

    expect(errorFor("Name")).toBe("Enter your name.");
    expect(errorFor("Email")).toBe("Enter your email address.");
    expect(errorFor("Message")).toBe("Enter a message.");
    expect(errorFor("Business name")).toBe("");
    expect(page.requests).toHaveLength(0);
  });

  it("checks fields by the Worker's rules, not just the browser's", () => {
    openContactPage();
    byRole("tab", "General enquiry").click();
    fill("Name", "   ");
    fill("Email", "ada@localhost");
    fill("Message", "Hello");

    click("Send enquiry");

    expect(errorFor("Name")).toBe("Enter your name.");
    expect(errorFor("Email")).toBe("Enter an email address like name@example.com.");
    expect(errorFor("Message")).toBe("");
  });

  it("shows each Book an audit error next to its field", () => {
    const page = openContactPage();
    fill("Name", "Ada Lovelace");

    click("Request an audit");

    expect(errorFor("Name")).toBe("");
    expect(errorFor("Business name")).toBe("Enter the business name.");
    expect(errorFor("Email")).toBe("Enter your email address.");
    expect(errorFor("Site town or city")).toBe("Enter the town or city the site is in.");
    expect(errorFor("Approximate number of infrastructure devices")).toBe(
      "Choose roughly how many infrastructure devices the site has.",
    );
    expect(page.requests).toHaveLength(0);
  });

  it("keeps a field's hint in what is read with it", () => {
    openContactPage();

    click("Request an audit");

    const devices = field("Approximate number of infrastructure devices");
    expect(description(devices)).toMatch(/^Switches, routers/);
    expect(description(devices)).toContain(
      "Choose roughly how many infrastructure devices the site has.",
    );
  });

  it("moves focus to the first field with an error", () => {
    openContactPage();
    fill("Name", "Ada Lovelace");

    click("Request an audit");

    expect(document.activeElement).toBe(field("Business name"));
  });

  it("clears an error once the visitor fixes the field", () => {
    openContactPage();
    byRole("tab", "General enquiry").click();
    click("Send enquiry");

    fill("Name", "Ada");
    fill("Email", "ada@");

    expect(errorFor("Name")).toBe("");
    expect(errorFor("Email")).toBe("Enter an email address like name@example.com.");
    expect(errorFor("Message")).toBe("Enter a message.");
    expect(field("Name").getAttribute("aria-invalid")).toBeNull();
  });

  it("doesn't flag a field before the visitor has tried to send", () => {
    openContactPage();
    byRole("tab", "General enquiry").click();

    fill("Email", "ada@");

    expect(errorFor("Email")).toBe("");
  });

  it("replaces the browser's own validation bubbles", () => {
    openContactPage();

    for (const form of document.querySelectorAll("form")) expect(form.noValidate).toBe(true);
  });
});

function fillEnquiry(): void {
  byRole("tab", "General enquiry").click();
  fill("Name", "Ada Lovelace");
  fill("Email", "ada@example.com");
  fill("Service", "network-projects");
  fill("Message", "Can you look after our office network?");
  solveTurnstile();
}

function fillAudit(): void {
  fill("Name", "Ada Lovelace");
  fill("Business name", "Analytical Engines Ltd");
  fill("Email", "ada@example.com");
  fill("Site town or city", "Raleigh");
  fill("Approximate number of infrastructure devices", "gt25");
  solveTurnstile();
}

/** The page's visible alert, once the script has shown one. */
async function alertShown(): Promise<HTMLElement> {
  return vi.waitFor(() => {
    const alert = [...document.querySelectorAll<HTMLElement>('[role="alert"]')].find(
      (el) => !el.closest("[hidden]") && el.textContent!.trim(),
    );
    if (!alert) throw new Error("No alert yet");
    return alert;
  });
}

const MAILTO = "mailto:hello@akimbo.technology";

describe("/contact sending in the page", () => {
  it("sends a General enquiry as JSON and confirms it in the page", async () => {
    const page = openContactPage();
    fillEnquiry();

    click("Send enquiry");

    const confirmation = await vi.waitFor(() => byRole("heading", "Thanks for getting in touch"));
    expect(page.requests).toHaveLength(1);
    const [request] = page.requests;
    expect(request.method).toBe("POST");
    expect(new URL(request.url).pathname).toBe("/api/contact");
    expect(request.headers.get("content-type")).toBe("application/json");
    expect(await request.json()).toMatchObject({
      kind: "enquiry",
      name: "Ada Lovelace",
      email: "ada@example.com",
      service: "network-projects",
      message: "Can you look after our office network?",
      website: "",
      "cf-turnstile-response": "token-from-widget",
    });
    expect(postmarkCalls(page)).toHaveLength(1);

    const shown = confirmation.parentElement!;
    expect(shown.textContent).toMatch(/reply within one business day/);
    expect(document.activeElement).toBe(shown);
    expect(() => byRole("button", "Send enquiry")).toThrow();
  });

  it("sends a Book an audit request and confirms it in the page", async () => {
    const page = openContactPage();
    fillAudit();

    click("Request an audit");

    await vi.waitFor(() => byRole("heading", "Thanks for getting in touch"));
    expect(await page.requests[0].json()).toMatchObject({
      kind: "audit",
      business: "Analytical Engines Ltd",
      devices: "gt25",
    });
    const [email] = postmarkCalls(page);
    expect((await email.json()).Subject).toBe(
      "[Audit] Ada Lovelace, Analytical Engines Ltd, Raleigh",
    );
  });

  it("sends once however often the button is pressed", async () => {
    const page = openContactPage();
    fillEnquiry();

    click("Send enquiry");
    click("Send enquiry");

    await vi.waitFor(() => byRole("heading", "Thanks for getting in touch"));
    expect(page.requests).toHaveLength(1);
  });

  it("asks the visitor to wait for the spam check before sending", () => {
    const page = openContactPage();
    fillEnquiry();
    document.querySelector('#enquiry-panel [name="cf-turnstile-response"]')!.remove();

    click("Send enquiry");

    const error = document.getElementById("enquiry-turnstile-error")!;
    expect(error.textContent).toMatch(/spam check/);
    // The widget may never load (an ad blocker), so the visitor can always email instead.
    expect(error.querySelector("a")!.getAttribute("href")).toBe(MAILTO);
    expect(page.requests).toHaveLength(0);
  });

  it("sends nothing while a field the visitor can't see is invalid", async () => {
    const page = openContactPage();
    fillAudit();
    document.querySelector<HTMLInputElement>('#audit-panel input[name="service"]')!.value = "bogus";

    click("Request an audit");

    const alert = await alertShown();
    expect(alert.textContent).toBe("Choose a service from the list.");
    expect(page.requests).toHaveLength(0);
  });

  it("shows a failed Turnstile check next to the widget and fetches a fresh token", async () => {
    const page = openContactPage("", {
      [TURNSTILE]: () => Response.json({ success: false }),
    });
    fillEnquiry();

    click("Send enquiry");

    const alert = await alertShown();
    expect(alert.textContent).toContain("We couldn't confirm you're not a bot. Please try again.");
    expect(document.activeElement).toBe(byRole("button", "Send enquiry"));
    expect(page.turnstileResets).toBe(1);
    expect(postmarkCalls(page)).toHaveLength(0);
  });

  it("shows the Worker's per-field errors next to the fields", async () => {
    openContactPage("", {}, async () =>
      Response.json({ errors: { email: "We can't deliver to that address." } }, { status: 422 }),
    );
    fillEnquiry();

    click("Send enquiry");

    await vi.waitFor(() => expect(errorFor("Email")).toBe("We can't deliver to that address."));
    expect(document.activeElement).toBe(field("Email"));
  });

  it("offers the mailto: fallback when sending fails, keeping what was typed", async () => {
    const page = openContactPage("", {
      [POSTMARK]: () => new Response("down", { status: 503 }),
    });
    fillEnquiry();

    click("Send enquiry");

    const alert = await alertShown();
    expect(alert.textContent).toContain("We couldn't send your enquiry.");
    expect(alert.querySelector("a")!.getAttribute("href")).toBe(MAILTO);
    expect(field("Message").value).toBe("Can you look after our office network?");
    expect(page.turnstileResets).toBe(1);
    expect(document.activeElement).toBe(byRole("button", "Send enquiry"));
  });

  it.each([
    ["the network fails", () => Promise.reject(new TypeError("Failed to fetch"))],
    ["the reply isn't JSON", async () => new Response("<h1>Bad gateway</h1>", { status: 502 })],
    ["the reply is an unexpected status", async () => new Response("", { status: 500 })],
  ])("offers the mailto: fallback when %s", async (_, worker) => {
    openContactPage("", {}, worker);
    fillAudit();

    click("Request an audit");

    const alert = await alertShown();
    expect(alert.textContent).toContain("hello@akimbo.technology");
    expect(alert.querySelector("a")!.getAttribute("href")).toBe(MAILTO);
    expect(byRole("button", "Request an audit")).toBeDefined();
  });

  it("lets the visitor try again after a failure", async () => {
    let fail = true;
    const page = openContactPage("", {
      [POSTMARK]: () =>
        fail
          ? new Response("down", { status: 503 })
          : Response.json({ ErrorCode: 0, MessageID: "id-2" }),
    });
    fillEnquiry();
    click("Send enquiry");
    await alertShown();

    fail = false;
    solveTurnstile();
    click("Send enquiry");

    await vi.waitFor(() => byRole("heading", "Thanks for getting in touch"));
    expect(page.requests).toHaveLength(2);
  });
});
