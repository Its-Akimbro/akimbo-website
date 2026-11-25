/** The slice of Cloudflare's `Fetcher` the Worker uses for static assets. */
export interface AssetsBinding {
  fetch(input: Request | string | URL, init?: RequestInit): Promise<Response>;
}

/**
 * The Marketing Worker's environment: bindings, config vars and secrets from
 * wrangler.jsonc. Upstream calls (Turnstile, Postmark) take their config and
 * `fetch` from here, so tests can swap in fakes.
 */
export interface Env {
  ASSETS: AssetsBinding;
  /** The canonical hostname; `www.<APEX_HOST>` redirects here. */
  APEX_HOST: string;
  /** Secret: the Postmark server token for the enquiry stream. */
  POSTMARK_TOKEN: string;
  /** Secret: the Turnstile widget's secret key, for siteverify. */
  TURNSTILE_SECRET: string;
  /**
   * Outbound HTTP for upstream calls. Not set in production, where the
   * global `fetch` is used; tests inject a fake.
   */
  fetch?: typeof fetch;
}
