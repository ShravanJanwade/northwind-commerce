import type { Money } from './money.ts';

const formatters = new Map<string, Intl.NumberFormat>();

/** "$12.99", "12,99 €", "CA$12.99" depending on the locale. */
export function formatMoney(value: Money, locale: string): string {
  const key = `${locale}:${value.currency}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: value.currency });
    formatters.set(key, formatter);
  }
  return formatter.format(value.amount / 100);
}
