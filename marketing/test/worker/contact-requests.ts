// Shared helpers for tests that post to /api/contact through the harness.
import { createHarness, type HarnessOptions } from "./harness";

export const TURNSTILE = "https://challenges.cloudflare.com";
export const POSTMARK = "https://api.postmarkapp.com";

/** A Turnstile siteverify fake that passes or fails every token. */
export function turnstile(success: boolean) {
  return () => Response.json({ success, "error-codes": success ? [] : ["invalid-input-response"] });
}

/** A Postmark fake that accepts every email. */
export function postmarkAccepts() {
  return () =>
    Response.json({
      To: "hello@akimbo.technology",
      SubmittedAt: "2026-11-24T12:00:00Z",
      MessageID: "b7bc2f4a-e38e-4336-af7d-e6c392c2f817",
      ErrorCode: 0,
      Message: "OK",
    });
}

export function site(upstreams: HarnessOptions["upstreams"] = {}) {
  return createHarness({
    upstreams: { [TURNSTILE]: turnstile(true), [POSTMARK]: postmarkAccepts(), ...upstreams },
  });
}

/** POST a form-encoded body to /api/contact, as a browser with no JS would. */
export function submit(
  harness: ReturnType<typeof createHarness>,
  fields: Record<string, string>,
  headers: Record<string, string> = {},
) {
  return harness.fetch("https://akimbo.technology/api/contact", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "text/html,application/xhtml+xml,*/*;q=0.8",
      ...headers,
    },
    body: new URLSearchParams(fields).toString(),
  });
}

/** Submit and ask for a JSON reply, to read the per-field errors. */
export async function submitForErrors(
  harness: ReturnType<typeof createHarness>,
  fields: Record<string, string>,
) {
  const response = await submit(harness, fields, { accept: "application/json" });
  return { status: response.status, body: await response.json() };
}

export function without(fields: Record<string, string>, ...names: string[]) {
  return Object.fromEntries(Object.entries(fields).filter(([name]) => !names.includes(name)));
}

export function postmarkCalls(harness: ReturnType<typeof createHarness>) {
  return harness.upstreamRequests.filter((r) => new URL(r.url).origin === POSTMARK);
}

/** POST a JSON body to /api/contact, as the contact page script does. */
export function submitJson(harness: ReturnType<typeof createHarness>, body: unknown) {
  return harness.fetch("https://akimbo.technology/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
}
