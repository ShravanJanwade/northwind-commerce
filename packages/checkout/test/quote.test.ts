import type { RegionConfig } from '@northwind/config';
import { describe, expect, it } from 'vitest';
import { amountToFreeShipping, CheckoutError, quote } from '../src/index.ts';

const us: RegionConfig = {
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

const eu: RegionConfig = {
  ...us,
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

describe('quote', () => {
  it('adds US sales tax and flat shipping under the threshold', () => {
    const q = quote([{ sku: 'NW-TEA-001', quantity: 2 }], us);
    expect(q.subtotal.amount).toBe(2198);
    expect(q.shipping.amount).toBe(599);
    expect(q.tax.amount.amount).toBe(159); // 7.25% of 21.98
    expect(q.total.amount).toBe(2198 + 599 + 159);
  });

  it('ships free once the discounted order reaches the threshold', () => {
    const q = quote([{ sku: 'NW-BRW-002', quantity: 1 }], us);
    expect(q.shipping.amount).toBe(0);
  });

  it('keeps VAT inside EU prices', () => {
    const q = quote([{ sku: 'NW-COF-001', quantity: 1 }], eu);
    expect(q.total.amount).toBe(1379 + 699);
    expect(q.tax.included).toBe(true);
    expect(q.tax.amount.amount).toBe(346); // VAT inside 20.78
  });

  it('merges repeated SKUs before applying volume discounts', () => {
    const q = quote(
      [
        { sku: 'NW-MUG-001', quantity: 2 },
        { sku: 'NW-MUG-001', quantity: 1 },
      ],
      us,
    );
    expect(q.lines).toHaveLength(1);
    expect(q.discounts.map((d) => d.code)).toEqual(['volume:NW-MUG-001']);
  });

  it('rejects what cannot be sold', () => {
    expect(() => quote([], us)).toThrow(CheckoutError);
    expect(() => quote([{ sku: 'NW-TEA-003', quantity: 1 }], us)).toThrow(/Only 0 of Rooibos/);
    expect(() => quote([{ sku: 'NW-MUG-001', quantity: 0 }], us)).toThrow(/whole number/);
    expect(() => quote([{ sku: 'NOPE', quantity: 1 }], us)).toThrow(/Unknown product/);
  });
});

describe('amountToFreeShipping', () => {
  it('counts down to the threshold and stops at zero', () => {
    expect(amountToFreeShipping({ amount: 6000, currency: 'USD' }, us).amount).toBe(1500);
    expect(amountToFreeShipping({ amount: 9000, currency: 'USD' }, us).amount).toBe(0);
  });
});
