// One line per service for the home-page tiles and the services hub, in
// the order they're shown: the Network Audit first, as the entry offer.
// Every price comes from the pricing module (#32).
import { AUDIT, formatUsd, SERVER_TIER, tier } from "./pricing";
import { contactHref, SERVICES, type ServiceSlug } from "./services";

export interface ServiceSummary {
  slug: ServiceSlug;
  name: string;
  /** Where the tile and hub row link. */
  href: string;
  /** The one-line description on the home-page tile. */
  tile: string;
  /** Completes "A good fit if…" on the services hub. */
  fit: string;
  /** How the service is billed, with its price where there is one. */
  billing: string;
}

const summary = (slug: ServiceSlug, rest: Omit<ServiceSummary, "slug" | "name">): ServiceSummary => ({
  slug,
  name: SERVICES[slug].name,
  ...rest,
});

export const SERVICE_SUMMARIES: readonly ServiceSummary[] = [
  summary("network-audit", {
    // Books the audit until the Network Audit page lands (#34), which
    // points this at /services/network-audit/.
    href: contactHref("network-audit"),
    tile: "Every device documented and a plain-English risk report, yours to keep.",
    fit: "you don't know what you have, or you're not sure where to start.",
    billing: `${formatUsd(AUDIT.price)}, fixed price`,
  }),
  summary("managed-networking", {
    href: "/services/managed-networking/",
    tile: "Your firewall, switches and Wi-Fi monitored, updated and looked after.",
    fit: "you want someone watching the network so you don't have to.",
    billing: `Monthly on any Plan, from ${formatUsd(tier("essentials").fromPerSite)} a site`,
  }),
  summary("servers-virtualisation", {
    href: "/services/servers-virtualisation/",
    tile: "Servers and virtual machines patched and watched, with restores tested.",
    fit: "you run servers on site, or aren't sure your backups would restore.",
    billing: `Monthly on ${SERVER_TIER.name}, from ${formatUsd(SERVER_TIER.fromPerSite)} a site`,
  }),
  summary("network-projects", {
    href: "/services/network-projects/",
    tile: "New offices, moves, Wi-Fi upgrades and rack clean-ups.",
    fit: "you're moving, expanding, or fixing one big problem.",
    billing: "Fixed price, quoted before work starts",
  }),
];
