import { AUDIT, HOURLY, PLAN_BASIS, SERVER_ADDONS, TIERS } from "../../src/pricing";
import { dollarAmounts } from "./dist";

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

/** Dollar amounts in some text that aren't among the module's prices. */
export function unpublishedAmounts(content: string): number[] {
  return dollarAmounts(content).filter((amount) => !MODULE_PRICES.has(amount));
}
