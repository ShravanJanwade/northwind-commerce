import { money, roundHalfAway, type Currency, type Money } from './money.ts';

/**
 * Converts at a quoted rate: 1 unit of the source currency buys `rate` units
 * of the target. Rates come from region configuration, so a published price
 * never changes between page builds without a config change.
 */
export function convert(value: Money, rate: number, to: Currency): Money {
  if (!(rate > 0) || !Number.isFinite(rate)) throw new RangeError(`Invalid exchange rate ${rate}`);
  if (value.currency === to && rate !== 1) throw new RangeError(`Converting ${to} to itself must use rate 1`);
  return money(roundHalfAway(value.amount * rate), to);
}

/**
 * Snaps a price to a retail ending by rounding up to the next whole unit and
 * stepping back to the ending: with ending 99, 12.40 → 12.99, 13.00 → 12.99
 * and 13.01 → 13.99. With ending 0 the price is left as it is.
 */
export function withPriceEnding(value: Money, ending: number): Money {
  if (ending === 0) return value;
  if (!Number.isInteger(ending) || ending < 1 || ending > 99) throw new RangeError(`Invalid price ending ${ending}`);
  const nextWholeUnit = Math.ceil(value.amount / 100) * 100;
  return money(nextWholeUnit - (100 - ending), value.currency);
}
