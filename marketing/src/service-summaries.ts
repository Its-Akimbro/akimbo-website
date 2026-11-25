// One line per service for the home-page tiles and the services hub, in
// the order they're shown: the Network Audit first, as the entry offer.
// Every price comes from the pricing module (#32).
import { AUDIT, formatUsd, SERVER_TIER, tier } from "./pricing";
import { SERVICES, type ServiceSlug } from "./services";

export interface ServiceSummary {
  slug: ServiceSlug;
  name: string;
  /** Where the tile and hub row link. */
  href: string;
  /** The entry offer, marked "Start here" and emphasised. */
  startHere: boolean;
  /** The one-line description on the home-page tile. */
  tagline: string;
  /** Completes "A good fit if…" on the services hub. */
  fit: string;
  /** How the service is billed, with its price where there is one. */
  billing: string;
}

type ServicePageSlug = Exclude<ServiceSlug, "network-audit">;

/** A service with its own page on the shared service-page template. */
const withPage = (
  slug: ServicePageSlug,
  rest: Pick<ServiceSummary, "tagline" | "fit" | "billing">,
): ServiceSummary => ({
  slug,
  name: SERVICES[slug].name,
  href: `/services/${slug}/`,
  startHere: false,
  ...rest,
});

export const SERVICE_SUMMARIES: readonly ServiceSummary[] = [
  {
    slug: "network-audit",
    name: SERVICES["network-audit"].name,
    // The Network Audit has its own page, not the shared template (#34).
    href: "/services/network-audit/",
    startHere: true,
    tagline: "Your network devices documented and a plain-English risk report, yours to keep.",
    fit: "you don't know what you have, or you're not sure where to start.",
    billing: `${formatUsd(AUDIT.price)}, fixed price`,
  },
  withPage("managed-networking", {
    tagline: "Your firewall, switches and Wi-Fi monitored, updated and looked after.",
    fit: "you want someone watching the network so you don't have to.",
    billing: `Monthly on any Plan, from ${formatUsd(tier("essentials").fromPerSite)} a site`,
  }),
  withPage("servers-virtualisation", {
    tagline: "Servers and virtual machines patched and watched, with restores tested.",
    fit: "you run servers on site, or aren't sure your backups would restore.",
    billing: `Monthly on ${SERVER_TIER.name}, from ${formatUsd(SERVER_TIER.fromPerSite)} a site`,
  }),
  withPage("network-projects", {
    tagline: "New offices, moves, Wi-Fi upgrades and rack clean-ups.",
    fit: "you're moving, expanding, or fixing one big problem.",
    billing: "Fixed price, quoted before work starts",
  }),
];
