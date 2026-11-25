// The contact page script (#40). Progressive enhancement only: without it
// both forms show and post as plain HTML forms.
import {
  CONFIRMATION,
  CONTACT_ENDPOINT,
  type FieldErrors,
  readSubmission,
  SEND_FAILED,
  TURNSTILE_FIELD,
} from "./contact-form";
import { isServiceSlug, type ServiceSlug } from "./services";
import { CONTACT_EMAIL } from "./site";

/** What the script needs from the browser, passed in so tests can stand in for it. */
export interface ContactPageEnv {
  /** The page's query string, e.g. "?service=network-audit". */
  search: string;
  /** Sends the form to the Worker. */
  fetch: typeof fetch;
  /** Ask the form's Turnstile widget for a fresh token (a token is single-use). */
  resetTurnstile: (form: HTMLFormElement) => void;
}

/**
 * Enhance the /contact page's forms: tabs, the `?service=` preset, inline
 * validation by the Worker's rules, and sending as JSON with the result
 * shown in the page. Does nothing on a page without the contact tabs.
 */
export function enhanceContactPage(doc: Document, env: ContactPageEnv): void {
  const container = doc.querySelector<HTMLElement>("[data-contact-tabs]");
  if (!container) return;
  const service = presetService(env.search);
  if (service) {
    for (const control of container.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
      '[name="service"]',
    )) {
      control.value = service;
    }
  }
  // A service page's contact link reads "Or ask a question about …", so a
  // preset opens the tab where the visitor sees the service they chose.
  const servicePicker = container.querySelector('select[name="service"]');
  makeTabs(doc, container, service ? servicePicker?.closest("[data-tab-panel]") : undefined);

  for (const form of container.querySelectorAll("form")) enhanceForm(env, form);
}

/** The allow-listed service slug in `?service=`, if there is one. Anything else is ignored. */
function presetService(search: string): ServiceSlug | undefined {
  const value = new URLSearchParams(search).get("service");
  return isServiceSlug(value) ? value : undefined;
}

const TAB_CLASS =
  "-mb-px min-h-11 border-b-2 border-transparent px-4 py-2 font-semibold text-muted hover:text-navy aria-selected:border-blue aria-selected:text-navy focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none";

/**
 * Turn the container's panels into tabs (the WAI-ARIA tabs pattern, with
 * automatic activation): each tab is named by its panel's heading. The
 * first panel is selected, or `initialPanel` if given.
 */
function makeTabs(doc: Document, container: HTMLElement, initialPanel?: Element | null): void {
  const panels = [...container.querySelectorAll<HTMLElement>("[data-tab-panel]")];
  const list = doc.createElement("div");
  list.setAttribute("role", "tablist");
  list.setAttribute("aria-label", "Contact forms");
  list.className = "flex flex-wrap gap-2 border-b border-slate-300";

  const tabs = panels.map((panel) => {
    const tab = doc.createElement("button");
    tab.type = "button";
    tab.id = `${panel.id}-tab`;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panel.id);
    tab.className = TAB_CLASS;
    tab.textContent = panel.querySelector("h2")?.textContent?.trim() ?? panel.id;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    // The panel starts with a heading, not a control, so it takes focus itself.
    panel.tabIndex = 0;
    list.append(tab);
    return tab;
  });

  const select = (index: number, focus: boolean) => {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[i].hidden = !selected;
    });
    if (focus) tabs[index].focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(i, false));
    tab.addEventListener("keydown", (event) => {
      const last = tabs.length - 1;
      const target = {
        ArrowRight: i === last ? 0 : i + 1,
        ArrowLeft: i === 0 ? last : i - 1,
        Home: 0,
        End: last,
      }[event.key];
      if (target === undefined) return;
      event.preventDefault();
      select(target, true);
    });
  });

  container.prepend(list);
  container.dataset.tabbed = "";
  select(Math.max(initialPanel ? panels.indexOf(initialPanel as HTMLElement) : 0, 0), false);
}

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const TURNSTILE_PENDING = "Our spam check hasn't finished yet. Wait a moment, then send again.";

/**
 * Check the form by the Worker's rules before sending, then send it as JSON
 * and show the result in the page. Once the visitor has tried to send,
 * errors update as they type.
 */
function enhanceForm(env: ContactPageEnv, form: HTMLFormElement): void {
  const doc = form.ownerDocument;
  // Our messages, next to each field, replace the browser's bubbles.
  form.noValidate = true;
  const kind = (form.elements.namedItem("kind") as HTMLInputElement | null)?.value ?? "form";
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');

  // Alerts exist before anything is put in them, so screen readers announce
  // the change. One sits by the Turnstile widget, one by the send button.
  const turnstileError = alertElement(doc, `${kind}-turnstile-error`);
  form.querySelector(".cf-turnstile")?.after(turnstileError);
  const formError = alertElement(doc, `${kind}-form-error`);
  (button?.parentElement ?? form).before(formError);

  let tried = false;
  let sending = false;

  /**
   * Show errors next to their fields; any without a visible field go by the
   * button. Returns the fields with errors, in page order.
   */
  const showErrors = (errors: FieldErrors): Control[] => {
    const { turnstile, ...fields } = errors;
    const invalid = showFieldErrors(form, fields);
    const shown = new Set(invalid.map((control) => control.name));
    // The widget may never load (an ad blocker), so offer email here too.
    turnstileError.replaceChildren(...(turnstile ? [`${turnstile} `, ...orEmail(doc)] : []));
    formError.textContent = Object.entries(fields)
      .filter(([name]) => !shown.has(name))
      .map(([, message]) => message)
      .join(" ");
    return invalid;
  };

  form.addEventListener("input", () => {
    if (tried) showFieldErrors(form, fieldErrors(form));
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending) return;
    tried = true;

    const data = new FormData(form);
    const errors = fieldErrors(form);
    if (!data.get(TURNSTILE_FIELD)) errors.turnstile = TURNSTILE_PENDING;
    const invalid = showErrors(errors);
    if (Object.keys(errors).length > 0) {
      invalid[0]?.focus();
      return;
    }

    // Not `disabled`: that would drop keyboard focus from the button.
    sending = true;
    form.setAttribute("aria-busy", "true");
    button?.setAttribute("aria-disabled", "true");
    const outcome = await send(env, data);
    sending = false;
    form.removeAttribute("aria-busy");
    button?.removeAttribute("aria-disabled");

    if (outcome.result === "sent") {
      confirm(form);
      return;
    }
    if (outcome.result === "invalid") {
      // Only a Turnstile check spends the token; field errors come first.
      if (outcome.errors.turnstile) env.resetTurnstile(form);
      showErrors(outcome.errors)[0]?.focus();
      return;
    }
    env.resetTurnstile(form);
    formError.replaceChildren(`${SEND_FAILED} `, ...orEmail(doc));
  });
}

/**
 * An empty live region that announces whatever is later put in it. While
 * empty it is visually hidden, not `display: none`, so it stays live.
 */
function alertElement(doc: Document, id: string): HTMLElement {
  const alert = doc.createElement("p");
  alert.id = id;
  alert.setAttribute("role", "alert");
  alert.className = "text-sm font-medium text-red-dark empty:sr-only";
  return alert;
}

/** "Please email hello@… instead.", with the address a mailto: link. */
function orEmail(doc: Document): (Node | string)[] {
  const link = doc.createElement("a");
  link.href = `mailto:${CONTACT_EMAIL}`;
  link.className = "underline";
  link.textContent = CONTACT_EMAIL;
  return ["Please email ", link, " instead."];
}

/** Replace the form with a confirmation, and move focus to it so it is read out. */
function confirm(form: HTMLFormElement): void {
  const doc = form.ownerDocument;
  // Not a live region: focus moving to it is what reads it out, once.
  const confirmation = doc.createElement("div");
  confirmation.tabIndex = -1;
  confirmation.className = "max-w-xl space-y-4 focus:outline-none";
  const heading = doc.createElement("h2");
  heading.textContent = CONFIRMATION.heading;
  const body = doc.createElement("p");
  body.textContent = CONFIRMATION.body;
  confirmation.append(heading, body);
  form.hidden = true;
  form.after(confirmation);
  confirmation.focus();
}

type Outcome = { result: "sent" } | { result: "invalid"; errors: FieldErrors } | { result: "failed" };

/** Post the form to the Worker as JSON and read its answer. */
async function send(env: ContactPageEnv, data: FormData): Promise<Outcome> {
  const body: Record<string, string> = {};
  for (const [name, value] of data) if (typeof value === "string") body[name] = value;
  try {
    const response = await env.fetch(CONTACT_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });
    const reply: unknown = await response.json().catch(() => undefined);
    if (response.ok && isObject(reply) && reply.ok === true) return { result: "sent" };
    if (response.status === 422 && isObject(reply) && isFieldErrors(reply.errors)) {
      return { result: "invalid", errors: reply.errors };
    }
  } catch {
    // The network failed: fall through to the mailto: fallback.
  }
  return { result: "failed" };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFieldErrors(value: unknown): value is FieldErrors {
  return (
    isObject(value) &&
    Object.keys(value).length > 0 &&
    Object.values(value).every((message) => typeof message === "string")
  );
}

/** The form's errors by the Worker's rules (Turnstile aside: only the Worker can check it). */
function fieldErrors(form: HTMLFormElement): FieldErrors {
  const data = new FormData(form);
  return readSubmission((name) => data.get(name)).errors;
}

/** The fields a visitor can see and fill in, in page order. */
function visibleControls(form: HTMLFormElement): Control[] {
  return [...form.querySelectorAll<Control>("input[name], select[name], textarea[name]")].filter(
    (control) => control.type !== "hidden" && control.tabIndex !== -1 && control.id,
  );
}

/**
 * Show each error next to its field, read out with it (aria-describedby),
 * and clear the rest. Returns the fields with errors, in page order.
 */
function showFieldErrors(form: HTMLFormElement, errors: FieldErrors): Control[] {
  const doc = form.ownerDocument;
  const invalid: Control[] = [];
  for (const control of visibleControls(form)) {
    const message = errors[control.name];
    const id = `${control.id}-error`;
    let error = doc.getElementById(id);
    const describedBy = (control.getAttribute("aria-describedby") ?? "")
      .split(/\s+/)
      .filter((ref) => ref && ref !== id);

    if (message) {
      if (!error) {
        error = doc.createElement("p");
        error.id = id;
        error.dataset.fieldError = "";
        error.className = "mt-1 text-sm font-medium text-red-dark";
        control.after(error);
      }
      error.textContent = message;
      control.setAttribute("aria-invalid", "true");
      control.setAttribute("aria-describedby", [...describedBy, id].join(" "));
      invalid.push(control);
    } else {
      error?.remove();
      control.removeAttribute("aria-invalid");
      if (describedBy.length > 0) control.setAttribute("aria-describedby", describedBy.join(" "));
      else control.removeAttribute("aria-describedby");
    }
  }
  return invalid;
}
