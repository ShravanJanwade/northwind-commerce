import type { Product } from '@northwind/catalog';
import type { RegionConfig } from '@northwind/config';
import { convert, money, withPriceEnding, type Money } from '@northwind/money';

/** The shelf price of a product in a region: converted from USD, then given the region's price ending. */
export function regionalPrice(product: Product, region: RegionConfig): Money {
  const usd = money(product.priceUsd, 'USD');
  const converted = region.currency === 'USD' ? usd : convert(usd, region.fxRate, region.currency);
  return withPriceEnding(converted, region.priceEnding);
}
