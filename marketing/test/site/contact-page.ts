// Seam 3: the contact page script on the built page. Loads dist/contact/
// into the test's DOM (run the test file under happy-dom), runs the
// script's entry point on it, and sends its requests to the Worker's fetch
// handler (seam 1) with fake upstreams. Nothing leaves the process.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TURNSTILE_FIELD } from "../../src/contact-form";
import { enhanceContactPage } from "../../src/contact-page";
import { POSTMARK, TURNSTILE } from "../worker/contact-requests";
import { createHarness, type HarnessOptions } from "../worker/harness";
import { DIST, SITE_ORIGIN } from "./dist";

export { POSTMARK, TURNSTILE };

export interface ContactPage {
  harness: ReturnType<typeof createHarness>;
  /** Requests the script sent to the Worker, in order. */
  requests: Request[];
  /** How many times the script asked for a Turnstile widget to be reset. */
  turnstileResets: number;
}

/**
 * Show the built /contact page, arriving with `search` as the query string,
 * and run the contact page script on it.
 */
export function openContactPage(
  search = "",
  upstreams: HarnessOptions["upstreams"] = {},
  /** Stands in for the Worker, e.g. to fail the request itself. */
  worker?: (request: Request) => Promise<Response>,
): ContactPage {
  const html = readFileSync(join(DIST, "contact/index.html"), "utf8");
  // Stylesheets and scripts aren't loaded: the test runs the script itself.
  const parsed = new DOMParser().parseFromString(
    html.replace(/<link [^>]*rel="stylesheet"[^>]*>|<script\b[\s\S]*?<\/script>/g, ""),
    "text/html",
  );
  document.head.innerHTML = parsed.head.innerHTML;
  document.body.innerHTML = parsed.body.innerHTML;

  const harness = createHarness({
    upstreams: {
      [TURNSTILE]: () => Response.json({ success: true }),
      [POSTMARK]: () => Response.json({ ErrorCode: 0, MessageID: "id-1" }),
      ...upstreams,
    },
  });
  const page: ContactPage = { harness, requests: [], turnstileResets: 0 };
  enhanceContactPage(document, {
    search,
    fetch: (input, init) => {
      const request = new Request(new URL(String(input), SITE_ORIGIN).toString(), init);
      page.requests.push(request.clone());
      return worker ? worker(request) : harness.fetch(request);
    },
    resetTurnstile: () => {
      page.turnstileResets += 1;
    },
  });
  return page;
}

/** The element with the given role whose accessible name is `name`. */
export function byRole(role: string, name: string | RegExp): HTMLElement {
  const found = [...document.querySelectorAll<HTMLElement>(`[role="${role}"], ${implicit(role)}`)]
    .filter((el) => !el.closest("[hidden]"))
    .find((el) => matches(accessibleName(el), name));
  if (!found) throw new Error(`No visible ${role} named ${String(name)}`);
  return found;
}

/** Elements that have `role` without saying so, as a CSS selector. */
function implicit(role: string): string {
  const selectors: Record<string, string> = { button: "button", heading: "h1, h2, h3", link: "a[href]" };
  // A role with no implicit elements still needs a valid selector: one that matches nothing.
  return selectors[role] ?? ":not(*)";
}

function matches(text: string, name: string | RegExp): boolean {
  return typeof name === "string" ? text === name : name.test(text);
}

/** An element's accessible name: aria-labelledby, aria-label, its label, or its text. */
export function accessibleName(el: Element): string {
  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    return labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }
  const label =
    el.getAttribute("aria-label") ??
    (el.id ? document.querySelector(`label[for="${el.id}"]`)?.textContent : undefined) ??
    el.textContent;
  return (label ?? "").replace(/\s+/g, " ").trim();
}

/** Text read out after a control's name: what its aria-describedby points at. */
export function description(el: Element): string {
  return (el.getAttribute("aria-describedby") ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The visible form control labelled `label` (its label text up to any "(optional)"). */
export function field(label: string): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  const found = [...document.querySelectorAll<HTMLElement>("input, select, textarea")]
    .filter((el) => !el.closest("[hidden]"))
    .find((el) => accessibleName(el).replace(/\s*\(optional\)$/, "") === label);
  if (!found) throw new Error(`No visible field labelled ${label}`);
  return found as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
}

/** Type into (or choose in) a field, as a visitor would. */
export function fill(label: string, value: string): void {
  const control = field(label);
  control.focus();
  control.value = value;
  control.dispatchEvent(new Event("input", { bubbles: true }));
  control.dispatchEvent(new Event("change", { bubbles: true }));
}

/** Focus and press the visible button with this name, as a keyboard user sending a form would. */
export function click(name: string): void {
  const button = byRole("button", name);
  button.focus();
  button.click();
}

/** The error a screen reader reads with this field, or "" if it has none. */
export function errorFor(label: string): string {
  const control = field(label);
  if (control.getAttribute("aria-invalid") !== "true") return "";
  const errors = (control.getAttribute("aria-describedby") ?? "")
    .split(/\s+/)
    .map((id) => document.getElementById(id))
    .filter((el) => el?.dataset.fieldError !== undefined);
  return errors.map((el) => el!.textContent!.trim()).join(" ");
}

/** Press a key on the focused element. */
export function press(key: string): void {
  (document.activeElement ?? document.body).dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
  );
}

/** What the Turnstile widget does once it has a token: add a hidden field to its form. */
export function solveTurnstile(): void {
  for (const widget of document.querySelectorAll(".cf-turnstile")) {
    widget.querySelector(`[name="${TURNSTILE_FIELD}"]`)?.remove();
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = TURNSTILE_FIELD;
    input.value = "token-from-widget";
    widget.append(input);
  }
}

/** The emails the Worker sent through (fake) Postmark. */
export function postmarkCalls(page: ContactPage): Request[] {
  return page.harness.upstreamRequests.filter((r) => r.url.startsWith(POSTMARK));
}
