// Every published price and term (spec #28, decided in ticket #14). Pages
// read from here and never hard-code a number, so a price change is a
// one-file PR. All amounts are whole US dollars, excluding sales tax.

/** The month these prices were set, as "YYYY-MM". */
export const PRICES_AS_OF = "2026-11";

export const CURRENCY = "USD";

/** The fixed-price Network Audit, the entry offer. */
export const AUDIT = {
  price: 1250,
  sites: 1,
  /** Infrastructure devices covered; endpoints are scanned but not counted. */
  maxDevices: 25,
  daysOnSite: 1,
  /** Each extra site or further block of devices is quoted from this. */
  addOnFrom: 500,
  addOnDeviceBlock: 25,
  /** The full fee is credited if a Plan or project is signed within this window. */
  creditWindowDays: 60,
  walkthroughMinutes: { min: 60, max: 90 },
} as const;

/** How a Plan is priced: a base price per site, then per-unit add-ons. */
export const PLAN_BASIS = {
  devicesIncludedPerSite: 10,
  perExtraDevice: 15,
  perExtraSite: 150,
} as const;

/** Server and VM add-ons, offered on Managed + Servers only. */
export const SERVER_ADDONS = {
  /** Physical servers or hypervisor hosts included in the Plan. */
  serversIncluded: 1,
  perExtraServer: 175,
  perVm: 100,
} as const;

export type TierId = "essentials" | "managed" | "managed-servers";

/** Response targets, in business hours unless "next business day". */
export interface ResponseTargets {
  critical: string;
  high: string;
  normal: string;
}

export interface Tier {
  id: TierId;
  name: string;
  /** The base monthly price for one site. */
  fromPerSite: number;
  /** Whether the server and VM add-ons are available. */
  coversServers: boolean;
  includes: string;
  servers: string;
  response: ResponseTargets;
  outOfHours: string;
  onSite: string;
}

/** Billable work outside a Plan's scope, and all work for non-Customers. */
export const HOURLY = {
  standard: 150,
  /** The rate for Customers on a Plan. */
  onPlan: 135,
  incrementMinutes: 15,
  onSiteMinimumHours: 1,
  outOfHoursMultiplier: 1.5,
  holidayMultiplier: 2,
  /** The minimum for out-of-hours and holiday work. */
  multiplierMinimumHours: 1,
} as const;

export const TRAVEL = {
  /** No trip charge within about this distance of base; mileage beyond. */
  freeRadiusMiles: 40,
  /** Scheduled visits cancelled with less notice than this are charged. */
  cancellationNoticeHours: 48,
} as const;

export const SUPPORT_HOURS = {
  days: "Monday–Friday",
  open: "8am",
  close: "5pm",
  timeZone: "Eastern",
} as const;

/** Support hours as one phrase, as the Plans page and the portal's outage page show them. */
export const SUPPORT_HOURS_TEXT = `${SUPPORT_HOURS.days}, ${SUPPORT_HOURS.open}–${SUPPORT_HOURS.close} ${SUPPORT_HOURS.timeZone}`;

export const CONTRACT = {
  cancellationNoticeDays: 30,
  priceChangeNoticeDays: 30,
} as const;

/** The free handover when a Customer leaves. */
export const EXIT_HANDOVER = {
  withinBusinessDays: 10,
  hoursWithNextProvider: 2,
} as const;

/** A routine change takes under about this long. */
export const ROUTINE_CHANGE_HOURS = 1;

/** The scheduled on-site visit included on Managed + Servers. */
const QUARTERLY_VISIT = "one scheduled half-day visit a quarter";

const MANAGED_RESPONSE: ResponseTargets = {
  critical: "1 business hour",
  high: "4 business hours",
  normal: "Next business day",
};

export const TIERS: readonly Tier[] = [
  {
    id: "essentials",
    name: "Essentials",
    fromPerSite: 175,
    coversServers: false,
    includes:
      "24/7 monitoring, firmware updates, config backup and live documentation in the Client Portal. Fault fixes are billed hourly.",
    servers: "Not covered",
    response: {
      critical: "4 business hours",
      high: "Next business day",
      normal: "Next business day",
    },
    outOfHours: `Billed at ${HOURLY.outOfHoursMultiplier}× the hourly rate`,
    onSite: "Billed hourly",
  },
  {
    id: "managed",
    name: "Managed",
    fromPerSite: 395,
    coversServers: false,
    includes:
      "Everything in Essentials, plus fault fixes and routine changes on covered equipment, firewall and security-policy management, and a quarterly review.",
    servers: "Not covered",
    response: MANAGED_RESPONSE,
    outOfHours: "Best-effort response to critical issues, with no time guarantee",
    onSite:
      "Included when a covered fault can't be fixed remotely. Target next business day, same day when available.",
  },
  {
    id: "managed-servers",
    name: "Managed + Servers",
    fromPerSite: 575,
    coversServers: true,
    includes:
      "Everything in Managed, extended to servers and virtualisation: OS and hypervisor patching, health monitoring, backup-job monitoring and a quarterly test restore.",
    servers: `${SERVER_ADDONS.serversIncluded} physical server or host included, then +${formatUsd(SERVER_ADDONS.perExtraServer)} a month per further server or host, and +${formatUsd(SERVER_ADDONS.perVm)} a month per managed VM`,
    response: MANAGED_RESPONSE,
    outOfHours: "Same as Managed",
    onSite: `Same as Managed, plus ${QUARTERLY_VISIT}`,
  },
];

/** The tier that covers servers and VMs. */
export const SERVER_TIER = TIERS.find((t) => t.coversServers)!;

export function tier(id: TierId): Tier {
  return TIERS.find((t) => t.id === id)!;
}

/** What a Customer's Plan covers: one tier across all its sites. */
export interface PlanSpec {
  tier: TierId;
  /** Network devices at each site; the first site is the base site. */
  siteDevices: number[];
  /** Physical servers or hypervisor hosts. */
  servers: number;
  /** Managed virtual machines. */
  vms: number;
}

export interface QuoteLine {
  label: string;
  amount: number;
}

export interface Quote {
  lines: QuoteLine[];
  /** The monthly total, the sum of the lines. */
  total: number;
}

/** The monthly price of a Plan, broken into line items. */
export function planQuote(plan: PlanSpec): Quote {
  const t = tier(plan.tier);
  if (!t.coversServers && (plan.servers > 0 || plan.vms > 0)) {
    throw new Error(`Servers and VMs are covered only on ${SERVER_TIER.name}, not ${t.name}.`);
  }
  const extraDevices = plan.siteDevices.reduce(
    (sum, devices) => sum + Math.max(0, devices - PLAN_BASIS.devicesIncludedPerSite),
    0,
  );
  const extraSites = Math.max(0, plan.siteDevices.length - 1);
  const extraServers = Math.max(0, plan.servers - SERVER_ADDONS.serversIncluded);

  const lines: QuoteLine[] = [
    {
      label: `${t.name}, first site (${PLAN_BASIS.devicesIncludedPerSite} network devices${
        t.coversServers ? ` and ${SERVER_ADDONS.serversIncluded} server or host` : ""
      } included)`,
      amount: t.fromPerSite,
    },
    perUnit(extraSites, ["extra site", "extra sites"], PLAN_BASIS.perExtraSite),
    perUnit(extraDevices, ["extra network device", "extra network devices"], PLAN_BASIS.perExtraDevice),
    perUnit(extraServers, ["further server or host", "further servers or hosts"], SERVER_ADDONS.perExtraServer),
    perUnit(plan.vms, ["managed VM", "managed VMs"], SERVER_ADDONS.perVm),
  ].filter((line) => line.amount > 0);

  return { lines, total: lines.reduce((sum, line) => sum + line.amount, 0) };
}

/** "3 managed VMs × $100". */
function perUnit(n: number, [one, many]: [string, string], price: number): QuoteLine {
  return { label: `${count(n, one, many)} × ${formatUsd(price)}`, amount: n * price };
}

/** "1 hour", "3 managed VMs". */
export function count(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** The one worked example on /plans (ticket #14). */
export const WORKED_EXAMPLE = {
  headcount: 40,
  plan: {
    tier: "managed-servers",
    siteDevices: [13],
    servers: 1,
    vms: 3,
  } satisfies PlanSpec,
};

/** "$1,250": whole US dollars, as the site shows prices. */
export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}

/** "November 2026", from PRICES_AS_OF. */
export function pricesAsOfLabel(): string {
  const [year, month] = PRICES_AS_OF.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
