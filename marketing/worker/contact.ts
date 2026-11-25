// POST /api/contact: turns a contact-form submission into one email in the
// `hello@` shared mailbox (ADR 0003). Stores nothing.
import {
  CONFIRMATION_PATH,
  HONEYPOT_FIELD,
  MAX_LENGTH,
  TURNSTILE_FIELD,
} from "../src/contact-form";
import { findService } from "../src/services";
import { CONTACT_EMAIL } from "../src/site";
import type { Env } from "./env";

const POSTMARK_EMAIL_API = "https://api.postmarkapp.com/email";
/** Postmark's enquiry message stream, kept apart from the portal's (spec #28). */
const POSTMARK_STREAM = "enquiries";
const FROM = "Akimbo Technology website <enquiries@notify.akimbo.technology>";
/** The only recipient. It is never taken from input. */
const TO = CONTACT_EMAIL;
const TURNSTILE_SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_FAILED = "We couldn't confirm you're not a bot. Please try again.";

interface Enquiry {
  name: string;
  email: string;
  message: string;
  business: string;
  service: string;
}

/** Per-field error messages, keyed by form field name. */
type FieldErrors = Record<string, string>;

export async function handleContact(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: { allow: "POST" } });
  }

  const form = await readForm(request);
  if (!form) {
    return new Response("Send the form as a form post", { status: 415 });
  }

  // Browsers submit line breaks as CRLF; normalise so lengths match maxlength.
  const field = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value.replace(/\r\n?/g, "\n").trim() : "";
  };
  // A bot filled the hidden field: look successful, send nothing.
  if (field(HONEYPOT_FIELD)) {
    log({ outcome: "honeypot" });
    return confirmed(request);
  }

  const enquiry: Enquiry = {
    name: field("name"),
    email: field("email"),
    message: field("message"),
    business: field("business"),
    service: field("service"),
  };

  const token = field(TURNSTILE_FIELD);
  const errors: FieldErrors = {
    ...kindErrors(field("kind")),
    ...enquiryErrors(enquiry),
    ...(token ? {} : { turnstile: TURNSTILE_FAILED }),
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

  const messageId = await sendEmail(send, env, enquiryEmail(enquiry));
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
  console.log(JSON.stringify({ route: "/api/contact", ...entry }));
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
  email: ReturnType<typeof enquiryEmail>,
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

function kindErrors(kind: string): FieldErrors {
  return kind === "enquiry" ? {} : { kind: "Choose which form you are sending." };
}

/**
 * An email address with no spaces, quotes, commas or angle brackets, so it
 * can only ever be one plain address, and a dotted domain.
 */
const EMAIL = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;

function enquiryErrors(enquiry: Enquiry): FieldErrors {
  const errors: FieldErrors = {};

  const check = (
    field: keyof Enquiry,
    { required, max }: { required?: string; max: { length: number; message: string } },
  ) => {
    const value = enquiry[field];
    if (!value) {
      if (required) errors[field] = required;
    } else if (value.length > max.length) {
      errors[field] = max.message;
    }
  };

  check("name", {
    required: "Enter your name.",
    max: { length: MAX_LENGTH.name, message: "Keep your name to 100 characters or fewer." },
  });
  check("email", {
    required: "Enter your email address.",
    max: { length: MAX_LENGTH.email, message: "Keep your email address to 254 characters or fewer." },
  });
  if (enquiry.email && !errors.email && !EMAIL.test(enquiry.email)) {
    errors.email = "Enter an email address like name@example.com.";
  }
  check("business", {
    max: { length: MAX_LENGTH.business, message: "Keep the business name to 150 characters or fewer." },
  });
  check("message", {
    required: "Enter a message.",
    max: { length: MAX_LENGTH.message, message: "Keep your message to 5,000 characters or fewer." },
  });
  if (enquiry.service && !findService(enquiry.service)) {
    errors.service = "Choose a service from the list.";
  }

  return errors;
}

// --- Responses -------------------------------------------------------------

/** Send the browser to the confirmation page (303, so it follows with a GET). */
function confirmed(request: Request): Response {
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
    `<p><a href="/contact/">Go back to the form</a> and try again, or email <a href="mailto:${TO}">${TO}</a>.</p>`,
  ]);
}

/** A small, self-contained page for a browser that posted the form without JS. */
function htmlPage(status: number, title: string, body: string[]): Response {
  const html = [
    "<!doctype html>",
    '<html lang="en">',
    '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
    `<meta name="robots" content="noindex"><title>${escapeHtml(title)} | Akimbo Technology</title></head>`,
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

/** The Postmark API body for an enquiry. */
function enquiryEmail(enquiry: Enquiry) {
  const name = oneLine(enquiry.name);
  const business = oneLine(enquiry.business);
  const service = findService(enquiry.service);

  return {
    MessageStream: POSTMARK_STREAM,
    From: FROM,
    To: TO,
    ReplyTo: enquiry.email,
    Subject: `[Enquiry] ${[name, business].filter(Boolean).join(", ")}`,
    TextBody: [
      "General enquiry from the website contact form.",
      "",
      `Name: ${name}`,
      `Email: ${enquiry.email}`,
      `Business: ${business || NOT_GIVEN}`,
      `Service: ${service ? `${service.label} (${service.slug})` : NOT_GIVEN}`,
      "Message:",
      ...block(enquiry.message),
      "",
    ].join("\n"),
    // No tracking pixels or rewritten links in mail to our own mailbox.
    TrackOpens: false,
    TrackLinks: "None",
  };
}

const NOT_GIVEN = "(not given)";

/** Control characters other than tab and newline; CR is one of them. */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000b-\u001f\u007f]/g;

/**
 * A value made safe for one line of the body or a header: CR/LF and runs of
 * whitespace become a single space and control characters are dropped.
 */
function oneLine(value: string): string {
  return value
    .replace(/[\r\n]+/g, " ")
    .replace(CONTROL_CHARS, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** A multi-line value indented under its label, so no line can pass for a label. */
function block(value: string): string[] {
  return value
    .replace(CONTROL_CHARS, "")
    .split("\n")
    .map((line) => `  ${line.trimEnd()}`);
}
