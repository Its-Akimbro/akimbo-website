import { AUDIT, HOURLY, PLAN_BASIS, SERVER_ADDONS, TIERS } from "../../src/pricing";

/** Every single price the pricing module publishes (not computed totals). */
export const MODULE_PRICES: ReadonlySet<number> = new Set([
  AUDIT.price,
  AUDIT.addOnFrom,
  ...TIERS.map((tier) => tier.fromPerSite),
  PLAN_BASIS.perExtraDevice,
  PLAN_BASIS.perExtraSite,
  SERVER_ADDONS.perExtraServer,
  SERVER_ADDONS.perVm,
  HOURLY.standard,
  HOURLY.onPlan,
]);
