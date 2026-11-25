// The services a visitor can name on the contact form. The slugs are the
// allow-list for the `service` field: the form offers them and the Marketing
// Worker rejects anything else. Define a service here once; everything reads it.

export interface Service {
  slug: string;
  label: string;
}

export const SERVICES = [
  { slug: "network-audit", label: "Network Audit" },
  { slug: "managed-networking", label: "Managed networking" },
  { slug: "servers-virtualisation", label: "Servers and virtualisation" },
  { slug: "network-projects", label: "Network projects" },
] as const satisfies readonly Service[];

/** The service with this slug, or undefined if it isn't on the allow-list. */
export function findService(slug: string): Service | undefined {
  return SERVICES.find((service) => service.slug === slug);
}
