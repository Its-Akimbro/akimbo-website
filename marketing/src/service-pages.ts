// Copy for the three pages on the shared service-page template
// (src/components/ServicePage.astro). The Network Audit has its own page.
// What each Plan tier includes follows the pricing decision (issue #14).
// Prices belong in the pricing module (#32), so none are written here.
import type { ServiceSlug } from "./services";

export interface ServicePageContent {
  slug: Exclude<ServiceSlug, "network-audit">;
  /** The meta description and the line under the heading. */
  summary: string;
  included: string[];
  forYou: string[];
  notForYou: string[];
  /** How this service is priced, in words; the link to /plans follows it. */
  pricing: string;
}

export const SERVICE_PAGES: ServicePageContent[] = [
  {
    slug: "managed-networking",
    summary:
      "Your firewall, switches and Wi-Fi, monitored, kept up to date and looked after for a flat monthly fee.",
    included: [
      "Round-the-clock monitoring, with alerts coming to us rather than you",
      "Firmware and security updates",
      "Configuration backups for every covered device",
      "Live documentation of your network in the Client Portal",
      "On Managed and above: fault fixes and routine changes on covered equipment",
      "On Managed and above: firewall and security-policy management, and a quarterly review",
      "On Managed and above: an on-site visit when a covered fault can't be fixed remotely",
    ],
    forYou: [
      "You have 10–100 staff, one or more offices, and no one in-house looking after the network.",
      "You want someone watching the network so you don't have to.",
      "You'd like your setup written down, and kept that way.",
    ],
    notForYou: [
      "You need desktop, laptop or help-desk support. We only look after networks, servers and virtualisation.",
      "You need a guaranteed 24/7 response. Alerts are answered in support hours, and out of hours on a best-effort basis on Managed and above.",
    ],
    pricing:
      "Managed networking comes with every Plan. Essentials covers monitoring, updates and configuration backups, with fixes billed by the hour. Managed adds fault fixes, routine changes and firewall management. Plans are priced per site, by the number of network devices.",
  },
  {
    slug: "servers-virtualisation",
    summary:
      "The servers and virtual machines your business runs on, patched and watched, with backups checked and restores actually tested.",
    included: [
      "Operating system and hypervisor patching",
      "Health monitoring for servers and hosts",
      "Backup-job monitoring, so a failed backup doesn't go unnoticed",
      "A test restore every quarter",
      "One scheduled half-day on-site visit a quarter",
      "Everything in the Managed plan for your network",
      "Your servers and virtual machines documented in the Client Portal",
    ],
    forYou: [
      "You run servers or virtual machines on site.",
      "You aren't sure your backups would actually restore.",
      "You want the network and the servers looked after by the same person.",
    ],
    notForYou: [
      "You need desktop, laptop or help-desk support.",
      "You're after backup storage, hardware or licences alone. We quote those separately.",
    ],
    pricing:
      "Servers and virtualisation are covered by the Managed + Servers plan. One physical server or host is included, and further servers, hosts and managed virtual machines are added per unit.",
  },
  {
    slug: "network-projects",
    summary:
      "A new office, an office move, Wi-Fi that finally reaches the back room, or a rack you can make sense of. One fixed price, agreed before work starts.",
    included: [
      "A fixed-price quote, based on what your audit found",
      "Planning and design, written down before anything changes",
      "Installing and configuring firewalls, switches, access points and servers",
      "Office moves, new sites and Wi-Fi upgrades",
      "Updated documentation and network diagram when the job is done",
    ],
    forYou: [
      "You're moving, opening a new site or expanding.",
      "You have one big problem to fix, not an ongoing one to manage.",
      "Your audit turned up work you want done.",
    ],
    notForYou: [
      "You want ongoing care. That's a Plan, and anything under about an hour on covered equipment is a routine change already included in Managed.",
      "You need desktops or laptops rolled out.",
    ],
    pricing:
      "Projects are quoted at a fixed price before work starts, and hardware and licences are quoted separately. Smaller jobs are billed by the hour, at a lower rate for clients on a Plan.",
  },
];
