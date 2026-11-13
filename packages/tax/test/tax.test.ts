import type { RegionConfig } from '@northwind/config';
import { money } from '@northwind/money';
import { describe, expect, it } from 'vitest';
import { computeTax } from '../src/index.ts';

const base = {
  name: 'Test',
  locale: 'en-US',
  fxRate: 1,
  priceEnding: 0,
  shippingFlat: 0,
  freeShippingFrom: 0,
  supportEmail: 'help@northwind.example',
};
const us: RegionConfig = { ...base, region: 'us', currency: 'USD', taxRate: 0.0725, taxIncluded: false, taxLabel: 'Sales tax' };
const eu: RegionConfig = { ...base, region: 'eu', currency: 'EUR', taxRate: 0.2, taxIncluded: true, taxLabel: 'TVA' };

describe('computeTax', () => {
  it('adds sales tax on top', () => {
    expect(computeTax(money(10_000, 'USD'), us)).toEqual({
      label: 'Sales tax',
      rate: 0.0725,
      included: false,
      amount: money(725, 'USD'),
    });
  });

  it('extracts VAT from a tax-inclusive price', () => {
    // 120.00 including 20% VAT holds 20.00 of tax
    expect(computeTax(money(12_000, 'EUR'), eu).amount).toEqual(money(2000, 'EUR'));
    expect(computeTax(money(1379, 'EUR'), eu).amount.amount).toBe(230);
  });

  it('refuses an amount in the wrong currency', () => {
    expect(() => computeTax(money(100, 'USD'), eu)).toThrow(TypeError);
  });
});
