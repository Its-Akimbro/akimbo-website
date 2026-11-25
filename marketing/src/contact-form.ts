// The contract between the /contact forms and the Marketing Worker's
// /api/contact handler: field names, length caps and the validation rules
// both sides enforce.
import { isServiceSlug } from "./services";

export const CONTACT_ENDPOINT = "/api/contact";
export const CONTACT_PAGE_PATH = "/contact/";
export const CONFIRMATION_PATH = "/contact/thanks/";

/** Longest accepted value of each free-text field, in characters. */
export const MAX_LENGTH = {
  name: 100,
  email: 254,
  business: 150,
  message: 5000,
  town: 100,
  phone: 40,
  timing: 200,
  notes: 5000,
} as const;

/** What a visitor sees once their enquiry is sent: in the page, or on CONFIRMATION_PATH. */
export const CONFIRMATION = {
  heading: "Thanks for getting in touch",
  body: "Your enquiry has reached us. We'll reply within one business day, to the email address you gave.",
} as const;

/** Sending failed. Always followed by the way to email instead. */
export const SEND_FAILED = "We couldn't send your enquiry.";

/** The hidden field only bots fill in. */
export const HONEYPOT_FIELD = "website";

/** The field the Turnstile widget adds to the form it sits in. */
export const TURNSTILE_FIELD = "cf-turnstile-response";

/**
 * The Turnstile widget's public site key. PLACEHOLDER: this is Cloudflare's
 * always-passes test key. Replace it with the managed, non-interactive
 * widget's key for the apex hostname (#42) before launch (#43). With the
 * real Worker secret, test-key tokens fail siteverify, so this fails closed.
 */
export const TURNSTILE_SITE_KEY = "1x00000000000000000000AA";

/**
 * The Book an audit form's answers to "roughly how many infrastructure
 * devices does the site have?", keyed by the submitted value.
 */
export const DEVICE_COUNTS = {
  lt10: "Under 10",
  "10to25": "10–25",
  gt25: "More than 25",
} as const;

export type DeviceCount = keyof typeof DEVICE_COUNTS;

export function isDeviceCount(value: string): value is DeviceCount {
  return Object.hasOwn(DEVICE_COUNTS, value);
}

// --- Validation ------------------------------------------------------------
// The Worker's rules, shared with the contact page script (#40) so a visitor
// sees the same errors before sending as the Worker would return.

/** An Enquiry sent from the General enquiry form (`kind=enquiry`). */
export interface GeneralEnquiry {
  name: string;
  email: string;
  message: string;
  business: string;
  service: string;
}

/** An audit request sent from the Book an audit form (`kind=audit`). */
export interface AuditRequest {
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
export type FieldErrors = Record<string, string>;

/** A submission read by its `kind`, with its field errors. */
export type Submission =
  | { kind: "audit"; audit: AuditRequest; errors: FieldErrors }
  | { kind: "enquiry"; enquiry: GeneralEnquiry; errors: FieldErrors };

/** Control characters other than tab and newline (CR included: see `fieldValue`). */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000b-\u001f\u007f]/g;

/**
 * A submitted value as the rules see it. Browsers submit line breaks as CRLF;
 * they are normalised so lengths match maxlength. Control characters are
 * dropped and the value is trimmed. Anything but a string counts as missing.
 */
export function fieldValue(value: unknown): string {
  return typeof value === "string"
    ? value.replace(/\r\n?/g, "\n").replace(CONTROL_CHARS, "").trim()
    : "";
}

/**
 * The submission's fields, by its `kind`, and their errors. `get` returns a
 * field's raw submitted value; each is read through `fieldValue`. A missing
 * or unknown kind is read as a General enquiry with a `kind` error.
 */
export function readSubmission(get: (name: string) => unknown): Submission {
  const field = (name: string) => fieldValue(get(name));
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
    return { kind, audit, errors: auditRequestErrors(audit) };
  }
  const enquiry: GeneralEnquiry = {
    name: field("name"),
    email: field("email"),
    message: field("message"),
    business: field("business"),
    service: field("service"),
  };
  return {
    kind: "enquiry",
    enquiry,
    errors: {
      ...(kind === "enquiry" ? {} : { kind: "Choose which form you are sending." }),
      ...generalEnquiryErrors(enquiry),
    },
  };
}

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
