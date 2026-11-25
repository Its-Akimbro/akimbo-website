// Seam 1: the Marketing Worker's fetch handler.
//
// Tests build `Request`s, call the handler with a test environment, and assert
// on the `Response` and on what the fakes received. Static assets and upstream
// HTTP calls (Turnstile siteverify, Postmark) are fakes: nothing leaves the
// process.
import worker from "../../worker/index";
import type { Env } from "../../worker/env";

export type Upstream = (request: Request) => Response | Promise<Response>;

export interface HarnessOptions {
  /** Fake static-asset responses, keyed by pathname. Unlisted paths 404. */
  assets?: Record<string, string>;
  /** Fake upstreams, keyed by origin (e.g. "https://api.postmarkapp.com"). */
  upstreams?: Record<string, Upstream>;
  /** Overrides for plain config vars and secrets. */
  vars?: Partial<Omit<Env, "ASSETS" | "fetch">>;
}

export interface Harness {
  /** Send a request to the Worker's fetch handler. */
  fetch(input: string | Request, init?: RequestInit): Promise<Response>;
  /** Requests the Worker made to the ASSETS binding, in order. */
  assetRequests: Request[];
  /** Requests the Worker made to upstreams, in order. */
  upstreamRequests: Request[];
}

export function createHarness(options: HarnessOptions = {}): Harness {
  const assetRequests: Request[] = [];
  const upstreamRequests: Request[] = [];
  const assets = options.assets ?? {};
  const upstreams = options.upstreams ?? {};

  const env: Env = {
    APEX_HOST: "akimbo.technology",
    ...options.vars,
    ASSETS: {
      async fetch(input: Request | string | URL, init?: RequestInit) {
        const request = new Request(input, init);
        assetRequests.push(request);
        const body = assets[new URL(request.url).pathname];
        return body === undefined
          ? new Response("Not found", { status: 404 })
          : new Response(body, {
              headers: { "content-type": "text/html; charset=utf-8" },
            });
      },
    },
    async fetch(input: Request | string | URL, init?: RequestInit) {
      const request = new Request(input, init);
      upstreamRequests.push(request.clone());
      const upstream = upstreams[new URL(request.url).origin];
      if (!upstream) {
        throw new Error(`Unexpected upstream request: ${request.method} ${request.url}`);
      }
      return upstream(request);
    },
  };

  return {
    assetRequests,
    upstreamRequests,
    fetch(input, init) {
      return worker.fetch(new Request(input, init), env);
    },
  };
}
