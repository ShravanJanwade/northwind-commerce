import type { RegionConfig } from '@northwind/config';
import { money, roundHalfAway, type Money } from '@northwind/money';

export interface TaxResult {
  label: string;
  rate: number;
  /** True when the amount is already inside the prices (EU VAT). */
  included: boolean;
  amount: Money;
}

/**
 * Tax on a taxable amount. Where prices include tax, the tax is extracted
 * from the amount for display and does not change the total; elsewhere it is
 * added on top.
 */
export function computeTax(taxable: Money, region: RegionConfig): TaxResult {
  if (taxable.currency !== region.currency) {
    throw new TypeError(`Tax for ${region.region} is computed in ${region.currency}, got ${taxable.currency}`);
  }
  const amount = region.taxIncluded
    ? roundHalfAway((taxable.amount * region.taxRate) / (1 + region.taxRate))
    : roundHalfAway(taxable.amount * region.taxRate);
  return {
    label: region.taxLabel,
    rate: region.taxRate,
    included: region.taxIncluded,
    amount: money(amount, region.currency),
  };
}
