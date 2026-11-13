import { CURRENCIES, type Currency } from '@northwind/money';

export type RegionCode = 'us' | 'ca' | 'eu';

export const REGIONS: readonly RegionCode[] = ['us', 'ca', 'eu'];

export interface RegionConfig {
  region: RegionCode;
  name: string;
  currency: Currency;
  locale: string;
  /** Units of `currency` per US dollar; catalog prices are kept in USD. */
  fxRate: number;
  /** 99 publishes prices as x.99; 0 leaves them as converted. */
  priceEnding: number;
  taxRate: number;
  /** EU prices include VAT; North American prices add tax at checkout. */
  taxIncluded: boolean;
  taxLabel: string;
  /** Minor units. */
  shippingFlat: number;
  /** Minor units; orders at or above this ship free. */
  freeShippingFrom: number;
  supportEmail: string;
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

type Check = (value: unknown) => boolean;

const isString: Check = (v) => typeof v === 'string' && v.trim().length > 0;
const isBoolean: Check = (v) => typeof v === 'boolean';
const isRate: Check = (v) => typeof v === 'number' && v >= 0 && v < 1;
const isPositive: Check = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;
const isMinorUnits: Check = (v) => Number.isSafeInteger(v) && (v as number) >= 0;
const isEnding: Check = (v) => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 99;
const isCurrency: Check = (v) => CURRENCIES.includes(v as Currency);
const isEmail: Check = (v) => typeof v === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

const SCHEMA: Record<Exclude<keyof RegionConfig, 'region'>, [Check, string]> = {
  name: [isString, 'a display name'],
  currency: [isCurrency, `one of ${CURRENCIES.join(', ')}`],
  locale: [isString, 'a BCP 47 locale such as en-US'],
  fxRate: [isPositive, 'a positive exchange rate'],
  priceEnding: [isEnding, 'a whole number from 0 to 99'],
  taxRate: [isRate, 'a fraction such as 0.2'],
  taxIncluded: [isBoolean, 'true or false'],
  taxLabel: [isString, 'a label such as "VAT"'],
  shippingFlat: [isMinorUnits, 'whole minor units'],
  freeShippingFrom: [isMinorUnits, 'whole minor units'],
  supportEmail: [isEmail, 'an email address'],
};

/** Validates raw JSON for one region. The first problem found is reported by key. */
export function parseRegionConfig(raw: unknown, region: string): RegionConfig {
  if (!(REGIONS as readonly string[]).includes(region)) {
    throw new ConfigurationError(`Unknown region "${region}". Expected one of ${REGIONS.join(', ')}`);
  }
  if (typeof raw !== 'object' || raw === null) {
    throw new ConfigurationError(`Region "${region}" configuration must be a JSON object`);
  }
  const values = raw as Record<string, unknown>;
  for (const [key, [check, expected]] of Object.entries(SCHEMA)) {
    if (!(key in values)) {
      throw new ConfigurationError(`Region "${region}" is missing required key "${key}"`);
    }
    if (!check(values[key])) {
      throw new ConfigurationError(
        `Region "${region}" key "${key}" must be ${expected}; got ${JSON.stringify(values[key])}`,
      );
    }
  }
  return { ...(values as Omit<RegionConfig, 'region'>), region: region as RegionCode };
}
