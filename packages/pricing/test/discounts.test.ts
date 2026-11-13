import { getProduct } from '@northwind/catalog';
import { describe, expect, it } from 'vitest';
import { applyDiscounts, regionalPrice } from '../src/index.ts';
import { EU, line, US } from './fixtures.ts';

describe('regionalPrice', () => {
  it('keeps the US list price', () => {
    expect(regionalPrice(getProduct('NW-COF-001')!, US).amount).toBe(1499);
  });

  it('converts for the EU without a price ending', () => {
    // 14.99 USD × 0.92 = 13.79 EUR
    expect(regionalPrice(getProduct('NW-COF-001')!, EU)).toEqual({ amount: 1379, currency: 'EUR' });
  });
});

describe('applyDiscounts', () => {
  it('gives ten percent off a line of three or more', () => {
    const result = applyDiscounts([line('NW-MUG-001', 'mugs', 1599, 3)], 'USD');
    expect(result.discounts.map((d) => d.code)).toEqual(['volume:NW-MUG-001']);
    expect(result.discountTotal.amount).toBe(480);
    expect(result.net.amount).toBe(4797 - 480);
  });

  it('discounts coffee bought with a brewer', () => {
    const result = applyDiscounts([line('NW-BRW-001', 'brewing', 2499), line('NW-COF-002', 'coffee', 1899, 2)], 'USD');
    expect(result.discounts).toHaveLength(1);
    expect(result.discounts[0]?.amount.amount).toBe(190);
  });

  it('applies a coupon after the automatic discounts', () => {
    const coupon = { code: 'SPRING', percentOff: 0.15, minimumSpend: 3000 };
    const result = applyDiscounts([line('NW-MUG-001', 'mugs', 1599, 3)], 'USD', coupon);
    // 4797 - 480 volume = 4317, then 15% = 648
    expect(result.discounts.map((d) => d.amount.amount)).toEqual([480, 648]);
    expect(result.net.amount).toBe(4797 - 480 - 648);
  });

  it('ignores a coupon below its minimum spend', () => {
    const coupon = { code: 'BIG', percentOff: 0.2, minimumSpend: 10_000 };
    const result = applyDiscounts([line('NW-TEA-001', 'tea', 1099)], 'USD', coupon);
    expect(result.discounts).toEqual([]);
    expect(result.net.amount).toBe(1099);
  });

  it('never discounts below zero', () => {
    const coupon = { code: 'ALL', percentOff: 0.99, minimumSpend: 0 };
    const result = applyDiscounts([line('NW-MUG-004', 'mugs', 1999, 5)], 'USD', coupon);
    expect(result.net.amount).toBeGreaterThanOrEqual(0);
  });
});
