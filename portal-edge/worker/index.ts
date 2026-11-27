import type { Env } from "./env";
import { outageResponse } from "./outage";

/**
 * Statuses only Cloudflare's side of the tunnel produces: 502 from cloudflared
 * when it can't reach the portal guest, and 530 (error 1033 in the body) when
 * no connector is up. Django and gunicorn never answer with either, so the
 * app's own 5xx responses still pass through.
 */
const ORIGIN_DOWN = new Set([502, 530]);

/** The portal edge Worker: forwards to the portal, or shows the outage page. */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // On the route the hostname is already the portal's, and Cloudflare sends
    // a Worker's request to its own zone straight to the origin. A preview URL
    // is on workers.dev, so it is pointed at the portal host too.
    const url = new URL(request.url);
    url.protocol = "https:";
    url.hostname = env.PORTAL_HOST;
    url.port = "";
    // Redirects go back to the browser as they are, so a Portal User follows
    // them to the portal and not through the Worker's own request. Every
    // portal response is per-user, so Cloudflare must not cache any of them,
    // static-looking paths included (needs compatibility_date 2024-11-11+).
    const toOrigin = new Request(url, request);
    // On a Worker's request to its own zone, Cloudflare can take the origin's
    // CF-Connecting-IP from X-Real-IP. The portal keys rate limits and the
    // audit log on that address, so the visitor never gets to choose it.
    const visitor = request.headers.get("cf-connecting-ip");
    if (visitor) toOrigin.headers.set("x-real-ip", visitor);
    else toOrigin.headers.delete("x-real-ip");
    let response: Response;
    try {
      response = await (env.fetch ?? fetch)(toOrigin, { redirect: "manual", cache: "no-store" });
    } catch {
      return outageResponse();
    }
    if (ORIGIN_DOWN.has(response.status)) {
      // Release the error page's stream; nothing reads it.
      await response.body?.cancel();
      return outageResponse();
    }
    return response;
  },
};
