import { describe, expect, it } from 'vitest';
import { ConfigurationError, parseRegionConfig } from '../src/index.ts';

// Fixtures rather than the real files: the shipped region files are checked
// by the deploy for each region, where a mistake stops only that region.
const valid = {
  name: 'Testland',
  currency: 'EUR',
  locale: 'fr-FR',
  fxRate: 0.92,
  priceEnding: 99,
  taxRate: 0.2,
  taxIncluded: true,
  taxLabel: 'TVA',
  shippingFlat: 699,
  freeShippingFrom: 8000,
  supportEmail: 'support@example.com',
};

describe('parseRegionConfig', () => {
  it('accepts a complete configuration', () => {
    expect(parseRegionConfig(valid, 'eu')).toMatchObject({ region: 'eu', currency: 'EUR', taxIncluded: true });
  });

  it('names the missing key', () => {
    const { taxLabel: _omitted, ...rest } = valid;
    expect(() => parseRegionConfig(rest, 'eu')).toThrow(new ConfigurationError('Region "eu" is missing required key "taxLabel"'));
  });

  it('explains a value of the wrong shape', () => {
    expect(() => parseRegionConfig({ ...valid, taxRate: 20 }, 'eu')).toThrow(/key "taxRate" must be a fraction/);
    expect(() => parseRegionConfig({ ...valid, currency: 'GBP' }, 'eu')).toThrow(/key "currency" must be one of/);
  });

  it('rejects unknown regions', () => {
    expect(() => parseRegionConfig(valid, 'mars')).toThrow(/Unknown region "mars"/);
  });
});
