import { describe, expect, it } from 'vitest';
import { getProduct, isCategory, listProducts, PRODUCTS } from '../src/index.ts';

describe('catalog', () => {
  it('has unique SKUs and whole-cent prices', () => {
    expect(new Set(PRODUCTS.map((p) => p.sku)).size).toBe(PRODUCTS.length);
    for (const product of PRODUCTS) expect(Number.isInteger(product.priceUsd)).toBe(true);
  });

  it('filters by category and stock', () => {
    expect(listProducts({ category: 'tea' })).toHaveLength(3);
    expect(listProducts({ category: 'tea', inStockOnly: true }).map((p) => p.sku)).not.toContain('NW-TEA-003');
  });

  it('searches names and descriptions without caring about case', () => {
    expect(listProducts({ search: 'BERGAMOT' }).map((p) => p.sku)).toEqual(['NW-TEA-001']);
    expect(listProducts({ search: '  grinder ' })).toHaveLength(1);
  });

  it('looks products up by SKU', () => {
    expect(getProduct('NW-BRW-002')?.name).toBe('Conical Burr Grinder');
    expect(getProduct('NW-NOPE-000')).toBeUndefined();
  });

  it('knows its categories', () => {
    expect(isCategory('mugs')).toBe(true);
    expect(isCategory('shoes')).toBe(false);
  });
});
