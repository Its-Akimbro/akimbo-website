// The services Akimbo sells, keyed by slug. This is the one allow-list of
// service slugs: service pages put the slug in their contact link
// (`/contact/?service=<slug>`), and the Marketing Worker will import it to
// validate the `service` field on `/api/contact`. Keep it free of page copy
// so the Worker bundle stays small.

export const SERVICES = {
  "network-audit": { name: "Network audit" },
  "managed-networking": { name: "Managed networking" },
  "servers-virtualisation": { name: "Servers and virtualisation" },
  "network-projects": { name: "Network projects" },
} as const satisfies Record<string, { name: string }>;

export type ServiceSlug = keyof typeof SERVICES;

/** Whether an untrusted value (a form field, a query string) is an allow-listed service slug. */
export function isServiceSlug(value: unknown): value is ServiceSlug {
  return typeof value === "string" && Object.hasOwn(SERVICES, value);
}

/** The contact page with the service preset, as a service page links to it. */
export function contactHref(slug: ServiceSlug): string {
  return `/contact/?service=${encodeURIComponent(slug)}`;
}
