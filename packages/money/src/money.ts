/**
 * Money is always an integer number of minor units (cents) plus a currency.
 * Floating point never touches a stored amount: every operation that can
 * produce a fraction rounds explicitly, half away from zero.
 */

export type Currency = 'USD' | 'CAD' | 'EUR';

export const CURRENCIES: readonly Currency[] = ['USD', 'CAD', 'EUR'];

export interface Money {
  /** Minor units, e.g. cents. */
  readonly amount: number;
  readonly currency: Currency;
}

export class CurrencyMismatchError extends Error {
  constructor(left: Currency, right: Currency) {
    super(`Cannot combine ${left} with ${right}`);
    this.name = 'CurrencyMismatchError';
  }
}

export function money(amount: number, currency: Currency): Money {
  if (!Number.isSafeInteger(amount)) {
    throw new TypeError(`Money amounts are whole minor units; got ${amount} ${currency}`);
  }
  return { amount, currency };
}

export function zero(currency: Currency): Money {
  return money(0, currency);
}

/** Rounds half away from zero, so 2.5 → 3 and -2.5 → -3. */
export function roundHalfAway(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

export function fromMajor(major: number, currency: Currency): Money {
  return money(roundHalfAway(major * 100), currency);
}

export function toMajor(value: Money): number {
  return value.amount / 100;
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) throw new CurrencyMismatchError(a.currency, b.currency);
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amount + b.amount, a.currency);
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amount - b.amount, a.currency);
}

export function multiply(value: Money, factor: number): Money {
  return money(roundHalfAway(value.amount * factor), value.currency);
}

/** `rate` is a fraction: 0.2 is twenty percent. */
export function percentOf(value: Money, rate: number): Money {
  return multiply(value, rate);
}

export function sum(values: readonly Money[], currency: Currency): Money {
  return values.reduce((total, value) => add(total, value), zero(currency));
}

export function compare(a: Money, b: Money): -1 | 0 | 1 {
  assertSameCurrency(a, b);
  return a.amount === b.amount ? 0 : a.amount < b.amount ? -1 : 1;
}

export function isZero(value: Money): boolean {
  return value.amount === 0;
}

export function isNegative(value: Money): boolean {
  return value.amount < 0;
}

export function max(a: Money, b: Money): Money {
  return compare(a, b) >= 0 ? a : b;
}

export function min(a: Money, b: Money): Money {
  return compare(a, b) <= 0 ? a : b;
}

export function equals(a: Money, b: Money): boolean {
  return a.currency === b.currency && a.amount === b.amount;
}
