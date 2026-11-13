import type { RegionConfig } from '@northwind/config';
import { money, type Money } from '@northwind/money';

/** Flat-rate shipping, free once the discounted order reaches the region's threshold. */
export function shippingFor(net: Money, region: RegionConfig): Money {
  if (net.amount === 0) return money(0, region.currency);
  return money(net.amount >= region.freeShippingFrom ? 0 : region.shippingFlat, region.currency);
}
