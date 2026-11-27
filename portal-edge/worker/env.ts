/**
 * The portal edge Worker's environment, from wrangler.jsonc. It holds no
 * secrets (ADR 0005).
 */
export interface Env {
  /** The Client Portal's public hostname; every request is forwarded there. */
  PORTAL_HOST: string;
  /**
   * Outbound HTTP to the origin. Not set in production, where the global
   * `fetch` is used; tests inject a fake origin.
   */
  fetch?: typeof fetch;
}
