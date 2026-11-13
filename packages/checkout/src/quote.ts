import { getProduct } from '@northwind/catalog';
import type { RegionConfig } from '@northwind/config';
import { add, type Money } from '@northwind/money';
import { applyDiscounts, lineTotal, regionalPrice, type Coupon, type Discount, type PricedLine } from '@northwind/pricing';
import { computeTax, type TaxResult } from '@northwind/tax';
import { shippingFor } from './shipping.ts';

export interface CartItem {
  sku: string;
  quantity: number;
}

export interface QuoteLine extends PricedLine {
  lineTotal: Money;
}

export interface Quote {
  region: RegionConfig['region'];
  currency: RegionConfig['currency'];
  lines: QuoteLine[];
  subtotal: Money;
  discounts: Discount[];
  discountTotal: Money;
  shipping: Money;
  tax: TaxResult;
  total: Money;
}

export const MAX_QUANTITY = 20;

export class CheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CheckoutError';
  }
}

function priceLines(items: readonly CartItem[], region: RegionConfig): QuoteLine[] {
  if (items.length === 0) throw new CheckoutError('The cart is empty');
  const merged = new Map<string, number>();
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY) {
      throw new CheckoutError(`Quantity for ${item.sku} must be a whole number from 1 to ${MAX_QUANTITY}`);
    }
    merged.set(item.sku, (merged.get(item.sku) ?? 0) + item.quantity);
  }
  return [...merged].map(([sku, quantity]) => {
    const product = getProduct(sku);
    if (!product) throw new CheckoutError(`Unknown product ${sku}`);
    if (product.stock < quantity) throw new CheckoutError(`Only ${product.stock} of ${product.name} left`);
    const line: PricedLine = {
      sku,
      name: product.name,
      category: product.category,
      quantity,
      unitPrice: regionalPrice(product, region),
    };
    return { ...line, lineTotal: lineTotal(line) };
  });
}

/** Prices a cart for one region. Pure: the same cart and config always produce the same quote. */
export function quote(items: readonly CartItem[], region: RegionConfig, coupon?: Coupon): Quote {
  const lines = priceLines(items, region);
  const { subtotal, discounts, discountTotal, net } = applyDiscounts(lines, region.currency, coupon);
  const shipping = shippingFor(net, region);
  const taxable = add(net, shipping);
  const tax = computeTax(region.taxIncluded ? taxable : net, region);
  const total = region.taxIncluded ? taxable : add(taxable, tax.amount);
  return {
    region: region.region,
    currency: region.currency,
    lines,
    subtotal,
    discounts,
    discountTotal,
    shipping,
    tax,
    total,
  };
}
