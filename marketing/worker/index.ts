import type { Env } from "./env";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname === `www.${env.APEX_HOST}`) {
      url.hostname = env.APEX_HOST;
      // 308 keeps the method and body, so a POST to www still reaches the apex.
      return Response.redirect(url.toString(), 308);
    }

    return env.ASSETS.fetch(request);
  },
};
