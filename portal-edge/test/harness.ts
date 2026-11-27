// Seam 5 (spec #16): the portal edge Worker's fetch handler with a fake
// origin.
//
// Tests build `Request`s, call the handler with a test environment, and assert
// on the `Response` and on what the fake origin received. Nothing leaves the
// process.
import worker from "../worker/index";
import type { Env } from "../worker/env";

/** The fake origin: answers, or throws to act as an unreachable origin. */
export type Origin = (request: Request) => Response | Promise<Response>;

export interface Harness {
  /** Send a request to the Worker's fetch handler. */
  fetch(input: string | Request, init?: RequestInit): Promise<Response>;
  /** Requests the Worker sent to the origin, in order. */
  originRequests: Request[];
  /** Every use of the Cache API the Worker made, by method name. */
  cacheCalls: string[];
}

export const PORTAL_HOST = "portal.akimbo.technology";

export function createHarness(origin: Origin): Harness {
  const originRequests: Request[] = [];
  const cacheCalls: string[] = [];

  const env: Env = {
    PORTAL_HOST,
    async fetch(input: Request | string | URL, init?: RequestInit) {
      const request = new Request(input, init);
      originRequests.push(request.clone());
      return origin(request);
    },
  };

  // Workers expose the Cache API as the `caches` global. A recording fake
  // stands in, so a test can show the Worker never reads or writes it.
  const recordingCache = new Proxy(
    {},
    {
      get: (_target, method) => (...args: unknown[]) => {
        cacheCalls.push(String(method));
        void args;
        return Promise.resolve(undefined);
      },
    },
  );
  const fakeCaches = {
    default: recordingCache,
    open: async () => {
      cacheCalls.push("open");
      return recordingCache;
    },
  };

  return {
    originRequests,
    cacheCalls,
    async fetch(input, init) {
      const saved = Object.getOwnPropertyDescriptor(globalThis, "caches");
      Object.defineProperty(globalThis, "caches", { value: fakeCaches, configurable: true });
      try {
        return await worker.fetch(new Request(input, init), env);
      } finally {
        if (saved) Object.defineProperty(globalThis, "caches", saved);
        else delete (globalThis as { caches?: unknown }).caches;
      }
    },
  };
}
