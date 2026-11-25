// POST /api/contact: turns a contact-form submission into one email in the
// `hello@` shared mailbox (ADR 0003). Stores nothing.
import {
  CONFIRMATION_PATH,
  CONTACT_ENDPOINT,
  CONTACT_PAGE_PATH,
  DEVICE_COUNTS,
  HONEYPOT_FIELD,
  isDeviceCount,
  MAX_LENGTH,
  TURNSTILE_FIELD,
} from "../src/contact-form";
import { AUDIT } from "../src/pricing";
import { isServiceSlug, SERVICES } from "../src/services";
import { CONTACT_EMAIL, SITE_NAME } from "../src/site";
import type { Env } from "./env";

const POSTMARK_EMAIL_API = "https://api.postmarkapp.com/email";
/** Postmark's enquiry message stream, kept apart from the portal's (spec #28). */
const POSTMARK_STREAM = "enquiries";
const FROM = "Akimbo Technology website <enquiries@notify.akimbo.technology>";
/** The only recipient. It is never taken from input. */
const TO = CONTACT_EMAIL;
const TURNSTILE_SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_FAILED = "We couldn't confirm you're not a bot. Please try again.";
/** Turnstile needs JavaScript; a visitor with it all off can only email. */
const TURNSTILE_MISSING = `We couldn't run our spam check, which needs JavaScript. Please email ${TO} instead.`;

/** An Enquiry sent from the General enquiry form (`kind=enquiry`). */
interface GeneralEnquiry {
  name: string;
  email: string;
  message: string;
  business: string;
  service: string;
}

/** An audit request sent from the Book an audit form (`kind=audit`). */
interface AuditRequest {
  name: string;
  business: string;
  email: string;
  town: string;
  devices: string;
  phone: string;
  timing: string;
  notes: string;
  /** The service page the visitor came from, if any. */
  service: string;
}

/** Per-field error messages, keyed by form field name. */
type FieldErrors = Record<string, string>;

/** The Postmark API body for one email to `hello@`. */
interface Email {
  MessageStream: string;
  From: string;
  To: string;
  ReplyTo: string;
  Subject: string;
  TextBody: string;
  TrackOpens: false;
  TrackLinks: "None";
}

/**
 * The submission's field errors, by its `kind`, and the email it would send.
 * The email is only meaningful when there are no errors.
 */
function readSubmission(field: (name: string) => string): { errors: FieldErrors; email: Email } {
  const kind = field("kind");
  if (kind === "audit") {
    const audit: AuditRequest = {
      name: field("name"),
      business: field("business"),
      email: field("email"),
      town: field("town"),
      devices: field("devices"),
      phone: field("phone"),
      timing: field("timing"),
      notes: field("notes"),
      service: field("service"),
    };
    return { errors: auditRequestErrors(audit), email: auditEmail(audit) };
  }
  const enquiry: GeneralEnquiry = {
    name: field("name"),
    email: field("email"),
    message: field("message"),
    business: field("business"),
    service: field("service"),
  };
  return {
    errors: {
      ...(kind === "enquiry" ? {} : { kind: "Choose which form you are sending." }),
      ...generalEnquiryErrors(enquiry),
    },
    email: generalEnquiryEmail(enquiry),
  };
}

export async function handleContact(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: { allow: "POST" } });
  }

  const form = await readForm(request);
  if (!form) {
    return new Response("Send the form as a form post", { status: 415 });
  }

  // Browsers submit line breaks as CRLF; normalise so lengths match maxlength.
  // Control characters are dropped before anything checks or uses a value.
  const field = (name: string) => {
    const value = form.get(name);
    return typeof value === "string"
      ? value.replace(/\r\n?/g, "\n").replace(CONTROL_CHARS, "").trim()
      : "";
  };
  // A bot filled the hidden field: look successful, send nothing.
  if (field(HONEYPOT_FIELD)) {
    log({ outcome: "honeypot" });
    return confirmed(request);
  }

  const { errors: fieldErrors, email } = readSubmission(field);
  const token = field(TURNSTILE_FIELD);
  const errors: FieldErrors = {
    ...fieldErrors,
    ...(token ? {} : { turnstile: TURNSTILE_MISSING }),
  };
  if (Object.keys(errors).length > 0) {
    log({ outcome: "invalid" });
    return validationFailed(request, errors);
  }

  const send = env.fetch ?? fetch;

  // Checked after the fields, so a visitor fixing a typo doesn't spend a token.
  const turnstile = await verifyTurnstile(
    send,
    env,
    token,
    request.headers.get("cf-connecting-ip"),
  );
  if (turnstile === "error") {
    log({ outcome: "turnstile_error" });
    return serviceFailed(request);
  }
  if (turnstile === "failed") {
    log({ outcome: "turnstile_failed" });
    return validationFailed(request, { turnstile: TURNSTILE_FAILED });
  }

  const messageId = await sendEmail(send, env, email);
  if (!messageId) {
    log({ outcome: "postmark_error" });
    return serviceFailed(request);
  }

  log({ outcome: "sent", messageId });
  return confirmed(request);
}

/**
 * One structured log line. Callers pass only an outcome and the Postmark
 * message ID: never a field value, and never an upstream error body, which
 * can quote the input back.
 */
function log(entry: { outcome: string; messageId?: string }): void {
  console.log(JSON.stringify({ route: CONTACT_ENDPOINT, ...entry }));
}

/** Cloudflare siteverify's verdict on the widget's token, or "error" if it couldn't say. */
async function verifyTurnstile(
  send: typeof fetch,
  env: Env,
  token: string,
  remoteIp: string | null,
): Promise<"passed" | "failed" | "error"> {
  const params = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
  if (remoteIp) params.set("remoteip", remoteIp);
  try {
    const response = await send(TURNSTILE_SITEVERIFY, { method: "POST", body: params });
    if (!response.ok) return "error";
    const result = (await response.json()) as { success?: unknown };
    return result.success === true ? "passed" : "failed";
  } catch {
    return "error";
  }
}

/** Send one email through Postmark; its message ID, or undefined if it wasn't accepted. */
async function sendEmail(
  send: typeof fetch,
  env: Env,
  email: Email,
): Promise<string | undefined> {
  try {
    const response = await send(POSTMARK_EMAIL_API, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-postmark-server-token": env.POSTMARK_TOKEN,
      },
      body: JSON.stringify(email),
    });
    if (!response.ok) return undefined;
    const result = (await response.json()) as { ErrorCode?: unknown; MessageID?: unknown };
    return result.ErrorCode === 0 && typeof result.MessageID === "string"
      ? result.MessageID
      : undefined;
  } catch {
    return undefined;
  }
}

/** The submitted form, or undefined if the body isn't a form post. */
async function readForm(request: Request): Promise<FormData | undefined> {
  const type = request.headers.get("content-type") ?? "";
  if (!/^(application\/x-www-form-urlencoded|multipart\/form-data)\b/i.test(type)) {
    return undefined;
  }
  try {
    return await request.formData();
  } catch {
    return undefined;
  }
}

// --- Validation ------------------------------------------------------------

/**
 * An email address with no spaces, quotes, commas or angle brackets, so it
 * can only ever be one plain address, and a dotted domain.
 */
const EMAIL =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;

/** "Keep your name to 100 characters or fewer." */
function tooLong(what: string, field: keyof typeof MAX_LENGTH): string {
  return `Keep ${what} to ${MAX_LENGTH[field].toLocaleString("en-US")} characters or fewer.`;
}

/**
 * A checker for one submission's fields: `text` checks a capped free-text
 * field, `email` the submitter's address and `service` the allow-listed
 * service slug. Errors collect in `errors`.
 */
function fieldChecker(values: Partial<Record<string, string>>) {
  const errors: FieldErrors = {};

  const text = (field: keyof typeof MAX_LENGTH, what: string, required?: string) => {
    const value = values[field];
    if (!value) {
      if (required) errors[field] = required;
    } else if (value.length > MAX_LENGTH[field]) {
      errors[field] = tooLong(what, field);
    }
  };

  const email = () => {
    text("email", "your email address", "Enter your email address.");
    if (values.email && !errors.email && !EMAIL.test(values.email)) {
      errors.email = "Enter an email address like name@example.com.";
    }
  };

  const service = () => {
    if (values.service && !isServiceSlug(values.service)) {
      errors.service = "Choose a service from the list.";
    }
  };

  return { errors, text, email, service };
}

function generalEnquiryErrors(enquiry: GeneralEnquiry): FieldErrors {
  const { errors, text, email, service } = fieldChecker({ ...enquiry });

  text("name", "your name", "Enter your name.");
  email();
  text("business", "the business name");
  text("message", "your message", "Enter a message.");
  service();

  return errors;
}

function auditRequestErrors(audit: AuditRequest): FieldErrors {
  const { errors, text, email, service } = fieldChecker({ ...audit });

  text("name", "your name", "Enter your name.");
  text("business", "the business name", "Enter the business name.");
  email();
  text("town", "the town or city", "Enter the town or city the site is in.");
  if (!isDeviceCount(audit.devices)) {
    errors.devices = "Choose roughly how many infrastructure devices the site has.";
  }
  text("phone", "your phone number");
  text("timing", "your preferred timing");
  text("notes", "your notes");
  service();

  return errors;
}

// --- Responses -------------------------------------------------------------

/**
 * Success: 200 JSON for the enhanced form, or send the browser to the
 * confirmation page (303, so it follows with a GET).
 */
function confirmed(request: Request): Response {
  if (wantsJson(request)) {
    return Response.json({ ok: true });
  }
  return Response.redirect(new URL(CONFIRMATION_PATH, request.url).toString(), 303);
}

/** Whether the client asked for JSON (the enhanced form) rather than a page. */
function wantsJson(request: Request): boolean {
  return /\bapplication\/json\b/i.test(request.headers.get("accept") ?? "");
}

const SERVICE_FAILED = `We couldn't send your enquiry. Please email ${TO} instead.`;

/** Turnstile or Postmark is down: hand the visitor the mailto: fallback. */
function serviceFailed(request: Request): Response {
  if (wantsJson(request)) {
    return Response.json({ error: SERVICE_FAILED, mailto: `mailto:${TO}` }, { status: 502 });
  }
  return htmlPage(502, "Your enquiry wasn't sent", [
    "<p>Something went wrong on our side and your enquiry wasn't sent.</p>",
    `<p>Please email <a href="mailto:${TO}">${TO}</a> instead. We reply within one business day.</p>`,
  ]);
}

function validationFailed(request: Request, errors: FieldErrors): Response {
  if (wantsJson(request)) {
    return Response.json({ errors }, { status: 422 });
  }
  return htmlPage(422, "Please check the form", [
    "<p>We couldn't send your enquiry yet:</p>",
    `<ul>${Object.values(errors)
      .map((message) => `<li>${escapeHtml(message)}</li>`)
      .join("")}</ul>`,
    `<p>You can email <a href="mailto:${TO}">${TO}</a> instead, or <a href="${CONTACT_PAGE_PATH}">go back to the form</a> and try again.</p>`,
  ]);
}

/** A small, self-contained page for a browser that posted the form without JS. */
function htmlPage(status: number, title: string, body: string[]): Response {
  const html = [
    "<!doctype html>",
    '<html lang="en">',
    '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
    `<meta name="robots" content="noindex"><title>${escapeHtml(title)} | ${SITE_NAME}</title></head>`,
    `<body><main><h1>${escapeHtml(title)}</h1>`,
    ...body,
    "</main></body></html>",
  ].join("\n");
  return new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!,
  );
}

// --- The email -------------------------------------------------------------

/** The Postmark API body for a General enquiry. */
function generalEnquiryEmail(enquiry: GeneralEnquiry): Email {
  const name = oneLine(enquiry.name);
  const business = oneLine(enquiry.business);

  return postmarkEmail(
    enquiry.email,
    `[Enquiry] ${[name, business].filter(Boolean).join(", ")}`,
    [
      "General enquiry from the website contact form.",
      "",
      `Name: ${name}`,
      `Email: ${enquiry.email}`,
      `Business: ${business || NOT_GIVEN}`,
      `Service: ${serviceLabel(enquiry.service)}`,
      "Message:",
      ...block(enquiry.message),
      "",
    ],
  );
}

/** The Postmark API body for a Network Audit request. */
function auditEmail(audit: AuditRequest): Email {
  const name = oneLine(audit.name);
  const business = oneLine(audit.business);
  const town = oneLine(audit.town);
  const devices = isDeviceCount(audit.devices) ? audit.devices : undefined;

  return postmarkEmail(audit.email, `[Audit] ${[name, business, town].join(", ")}`, [
      "Network Audit request from the website contact form.",
      "",
      `Name: ${name}`,
      `Business: ${business}`,
      `Email: ${audit.email}`,
      `Phone: ${oneLine(audit.phone) || NOT_GIVEN}`,
      `Site town/city: ${town}`,
      `Infrastructure devices: ${devices ? DEVICE_COUNTS[devices] : NOT_GIVEN}`,
      `Over the ${AUDIT.maxDevices}-device audit limit: ${
        devices === "gt25" ? "Yes, quote the add-on" : "No"
      }`,
      `Preferred timing: ${oneLine(audit.timing) || NOT_GIVEN}`,
      `Referring service: ${serviceLabel(audit.service)}`,
      ...(audit.notes ? ["Notes:", ...block(audit.notes)] : [`Notes: ${NOT_GIVEN}`]),
      "",
  ]);
}

/** One email to `hello@` on the enquiry stream, replying to the submitter. */
function postmarkEmail(replyTo: string, subject: string, lines: string[]): Email {
  return {
    MessageStream: POSTMARK_STREAM,
    From: FROM,
    To: TO,
    ReplyTo: replyTo,
    Subject: subject,
    TextBody: lines.join("\n"),
    // No tracking pixels or rewritten links in mail to our own mailbox.
    TrackOpens: false,
    TrackLinks: "None",
  };
}

/** "Managed networking (managed-networking)", or "(not given)". */
function serviceLabel(value: string): string {
  return isServiceSlug(value) ? `${SERVICES[value].name} (${value})` : NOT_GIVEN;
}

const NOT_GIVEN = "(not given)";

/** Control characters other than tab and newline (CR included: see `field`). */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000b-\u001f\u007f]/g;

/**
 * A value made safe for one line of the body or a header: line breaks and
 * runs of whitespace become a single space.
 */
function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** A multi-line value indented under its label, so no line can pass for a label. */
function block(value: string): string[] {
  return value.split("\n").map((line) => `  ${line.trimEnd()}`);
}
