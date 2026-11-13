import type { Category } from '@northwind/catalog';
import { min, money, multiply, percentOf, subtract, sum, type Currency, type Money } from '@northwind/money';

export interface PricedLine {
  sku: string;
  name: string;
  category: Category;
  quantity: number;
  unitPrice: Money;
}

export interface Discount {
  code: string;
  label: string;
  /** Positive: the amount taken off. */
  amount: Money;
}

export interface Coupon {
  code: string;
  /** Fraction off the order after automatic discounts, e.g. 0.15. */
  percentOff: number;
  /** Minor units the order must reach, after automatic discounts. */
  minimumSpend: number;
}

/** Three or more of the same item: ten percent off that line. */
export const VOLUME_MIN_QUANTITY = 3;
export const VOLUME_RATE = 0.1;
/** A brewer and a coffee in the same order: five percent off the coffee. */
export const BREW_KIT_RATE = 0.05;

export function lineTotal(line: PricedLine): Money {
  return multiply(line.unitPrice, line.quantity);
}

export function volumeDiscounts(lines: readonly PricedLine[]): Discount[] {
  return lines
    .filter((line) => line.quantity >= VOLUME_MIN_QUANTITY)
    .map((line) => ({
      code: `volume:${line.sku}`,
      label: `${Math.round(VOLUME_RATE * 100)}% off ${line.quantity} × ${line.name}`,
      amount: percentOf(lineTotal(line), VOLUME_RATE),
    }));
}

export function brewKitDiscount(lines: readonly PricedLine[], currency: Currency): Discount | null {
  const hasBrewer = lines.some((line) => line.category === 'brewing');
  const coffee = lines.filter((line) => line.category === 'coffee');
  if (!hasBrewer || coffee.length === 0) return null;
  return {
    code: 'brew-kit',
    label: 'Brew kit: 5% off coffee with a brewer',
    amount: percentOf(sum(coffee.map(lineTotal), currency), BREW_KIT_RATE),
  };
}

export interface DiscountResult {
  subtotal: Money;
  discounts: Discount[];
  discountTotal: Money;
  /** Subtotal less every discount, never below zero. */
  net: Money;
}

/**
 * Automatic discounts first (volume, then brew kit), then at most one coupon
 * on what is left. A coupon below its minimum spend is ignored rather than
 * rejected, so the customer still checks out.
 */
export function applyDiscounts(lines: readonly PricedLine[], currency: Currency, coupon?: Coupon): DiscountResult {
  const subtotal = sum(lines.map(lineTotal), currency);
  const discounts: Discount[] = [...volumeDiscounts(lines)];
  const brewKit = brewKitDiscount(lines, currency);
  if (brewKit) discounts.push(brewKit);

  const automatic = sum(
    discounts.map((d) => d.amount),
    currency,
  );
  const afterAutomatic = subtract(subtotal, min(automatic, subtotal));
  if (coupon && afterAutomatic.amount >= coupon.minimumSpend) {
    discounts.push({
      code: `coupon:${coupon.code}`,
      label: `Coupon ${coupon.code}: ${Math.round(coupon.percentOff * 100)}% off`,
      amount: percentOf(afterAutomatic, coupon.percentOff),
    });
  }

  const discountTotal = min(
    sum(
      discounts.map((d) => d.amount),
      currency,
    ),
    subtotal,
  );
  return { subtotal, discounts, discountTotal, net: subtract(subtotal, discountTotal) };
}

export function noDiscount(currency: Currency): DiscountResult {
  const nothing = money(0, currency);
  return { subtotal: nothing, discounts: [], discountTotal: nothing, net: nothing };
}
