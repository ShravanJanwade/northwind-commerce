import { describe, expect, it } from 'vitest';
import {
  add,
  allocate,
  convert,
  CurrencyMismatchError,
  formatMoney,
  fromMajor,
  money,
  multiply,
  percentOf,
  subtract,
  sum,
  withPriceEnding,
} from '../src/index.ts';

describe('money arithmetic', () => {
  it('adds and subtracts in minor units', () => {
    expect(add(money(1050, 'USD'), money(249, 'USD'))).toEqual(money(1299, 'USD'));
    expect(subtract(money(1000, 'EUR'), money(1, 'EUR'))).toEqual(money(999, 'EUR'));
  });

  it('refuses to mix currencies', () => {
    expect(() => add(money(1, 'USD'), money(1, 'CAD'))).toThrow(CurrencyMismatchError);
  });

  it('rejects fractional cents', () => {
    expect(() => money(10.5, 'USD')).toThrow(TypeError);
  });

  it('rounds half away from zero', () => {
    expect(multiply(money(5, 'USD'), 0.5)).toEqual(money(3, 'USD'));
    expect(multiply(money(-5, 'USD'), 0.5)).toEqual(money(-3, 'USD'));
    expect(percentOf(money(1999, 'USD'), 0.0725)).toEqual(money(145, 'USD'));
    expect(fromMajor(19.995, 'USD').amount).toBe(2000);
  });

  it('sums a list, including an empty one', () => {
    expect(sum([money(100, 'CAD'), money(250, 'CAD')], 'CAD')).toEqual(money(350, 'CAD'));
    expect(sum([], 'EUR')).toEqual(money(0, 'EUR'));
  });
});

describe('allocate', () => {
  it('never loses a cent', () => {
    const shares = allocate(money(1000, 'USD'), [1, 1, 1]);
    expect(shares.map((s) => s.amount)).toEqual([334, 333, 333]);
    expect(shares.reduce((a, s) => a + s.amount, 0)).toBe(1000);
  });

  it('follows the weights', () => {
    expect(allocate(money(-500, 'EUR'), [3, 1]).map((s) => s.amount)).toEqual([-375, -125]);
  });

  it('returns zeros when every weight is zero', () => {
    expect(allocate(money(100, 'USD'), [0, 0]).map((s) => s.amount)).toEqual([0, 0]);
  });
});

describe('conversion and price endings', () => {
  it('converts at the quoted rate', () => {
    expect(convert(money(1000, 'USD'), 1.37, 'CAD')).toEqual(money(1370, 'CAD'));
    expect(() => convert(money(1000, 'USD'), 0, 'EUR')).toThrow(RangeError);
  });

  it('snaps up to a .99 ending', () => {
    expect(withPriceEnding(money(1240, 'USD'), 99).amount).toBe(1299);
    expect(withPriceEnding(money(1300, 'USD'), 99).amount).toBe(1299);
    expect(withPriceEnding(money(1301, 'USD'), 99).amount).toBe(1399);
    expect(withPriceEnding(money(1260, 'USD'), 0).amount).toBe(1260);
  });
});

describe('formatMoney', () => {
  it('formats per locale', () => {
    expect(formatMoney(money(1299, 'USD'), 'en-US')).toBe('$12.99');
    expect(formatMoney(money(1299, 'EUR'), 'fr-FR').replace(/\s/g, ' ')).toBe('12,99 €');
  });
});
