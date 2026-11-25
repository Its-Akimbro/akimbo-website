// The contract between the /contact forms and the Marketing Worker's
// /api/contact handler: field names and length caps both sides enforce.

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
