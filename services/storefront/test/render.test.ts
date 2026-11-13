import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Product } from '@northwind/catalog';
import type { RegionConfig } from '@northwind/config';
import { afterEach, describe, expect, it } from 'vitest';
import { buildStorefront } from '../src/build.ts';
import { escapeHtml, renderHome, renderProduct } from '../src/render.ts';

const eu: RegionConfig = {
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
  supportEmail: 'service@northwind.example',
};
const release = { commit: '0123456789abcdef', builtAt: '2026-11-13T00:00:00.000Z' };
const flat = (html: string) => html.replace(/\s/g, ' ');

describe('storefront rendering', () => {
  it('prices products in the region and says tax is included', () => {
    const product: Product = {
      sku: 'NW-COF-001',
      name: 'Morning Ridge Blend, 340 g',
      category: 'coffee',
      priceUsd: 1499,
      weightGrams: 360,
      stock: 5,
      description: 'Medium roast.',
    };
    const html = flat(renderHome([product], eu, release));
    expect(html).toContain('13,79 €');
    expect(html).toContain('Prices include TVA at 20%.');
    expect(html).toContain('Release 0123456');
  });

  it('escapes catalog text', () => {
    expect(escapeHtml('<b>"Tom" & Jerry\'s</b>')).toBe('&lt;b&gt;&quot;Tom&quot; &amp; Jerry&#39;s&lt;/b&gt;');
    const product: Product = {
      sku: 'NW-X',
      name: '<script>alert(1)</script>',
      category: 'mugs',
      priceUsd: 100,
      weightGrams: 1,
      stock: 0,
      description: 'x',
    };
    const html = renderProduct(product, eu, release);
    expect(html).not.toContain('<script>');
    expect(html).toContain('Sold out');
  });
});

describe('buildStorefront', () => {
  let dir = '';
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('writes pages, the JSON catalog and a version stamp', () => {
    dir = mkdtempSync(join(tmpdir(), 'storefront-'));
    const result = buildStorefront(eu, dir, release);
    expect(result.files).toContain('index.html');
    expect(result.files).toContain('p/nw-brw-002.html');
    const catalog = JSON.parse(readFileSync(join(dir, 'api/products.json'), 'utf8'));
    expect(catalog.currency).toBe('EUR');
    expect(catalog.products).toHaveLength(16);
    expect(JSON.parse(readFileSync(join(dir, 'version.json'), 'utf8'))).toMatchObject({ region: 'eu', commit: release.commit });
  });
});
