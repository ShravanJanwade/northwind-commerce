import type { RegionConfig } from '@northwind/config';
import { money, type Currency } from '@northwind/money';
import type { PricedLine } from '../src/index.ts';

export const US: RegionConfig = {
  region: 'us',
  name: 'United States',
  currency: 'USD',
  locale: 'en-US',
  fxRate: 1,
  priceEnding: 99,
  taxRate: 0.0725,
  taxIncluded: false,
  taxLabel: 'Sales tax',
  shippingFlat: 599,
  freeShippingFrom: 7500,
  supportEmail: 'help@northwind.example',
};

export const EU: RegionConfig = {
  ...US,
  region: 'eu',
  name: 'France',
  currency: 'EUR',
  locale: 'fr-FR',
  fxRate: 0.92,
  priceEnding: 0,
  taxRate: 0.2,
  taxIncluded: true,
  taxLabel: 'TVA',
  shippingFlat: 699,
  freeShippingFrom: 8000,
};

export function line(
  sku: string,
  category: PricedLine['category'],
  unit: number,
  quantity = 1,
  currency: Currency = 'USD',
): PricedLine {
  return { sku, name: sku, category, quantity, unitPrice: money(unit, currency) };
}
