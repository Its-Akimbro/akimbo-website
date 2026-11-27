import { OUTAGE_PAGE } from "./outage-page";

/**
 * Seconds a browser or crawler should wait before trying again. A planned
 * window is minutes long, and the outage cron checks every 5 minutes.
 */
const RETRY_AFTER_SECONDS = 300;

/**
 * The page is self-contained: inline styles, and fonts and the lockup as
 * data: URLs. The CSP allows only that.
 */
const CSP =
  "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

/** The branded "Client Portal temporarily unavailable" response. */
export function outageResponse(): Response {
  return new Response(OUTAGE_PAGE, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "retry-after": String(RETRY_AFTER_SECONDS),
      "content-security-policy": CSP,
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
    },
  });
}
