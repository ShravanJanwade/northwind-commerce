import type { DatabaseSync } from 'node:sqlite';
import { getProduct, isCategory, listProducts, type Category, type Product } from '@northwind/catalog';
import { CheckoutError, quote, type CartItem } from '@northwind/checkout';
import type { RegionConfig } from '@northwind/config';
import { formatMoney } from '@northwind/money';
import { regionalPrice, type Coupon } from '@northwind/pricing';
import { HttpError, readJson, sendJson } from './http.ts';
import { findOrder, saveOrder } from './orders.ts';
import { Router } from './router.ts';

export interface AppOptions {
  db: DatabaseSync;
  regions: readonly RegionConfig[];
  commit: string;
}

/** Codes that are always valid; campaign codes live in the marketing system. */
export const PROMOTIONS: Record<string, Coupon> = {
  WELCOME10: { code: 'WELCOME10', percentOff: 0.1, minimumSpend: 0 },
};

function productView(product: Product, region: RegionConfig) {
  const price = regionalPrice(product, region);
  return {
    sku: product.sku,
    name: product.name,
    category: product.category,
    description: product.description,
    inStock: product.stock > 0,
    price: { ...price, formatted: formatMoney(price, region.locale) },
  };
}

function parseCart(body: Record<string, unknown>): CartItem[] {
  if (!Array.isArray(body.items)) throw new HttpError(400, 'items must be an array of { sku, quantity }');
  return body.items.map((item: unknown) => {
    const { sku, quantity } = (item ?? {}) as Record<string, unknown>;
    if (typeof sku !== 'string' || typeof quantity !== 'number') {
      throw new HttpError(400, 'Each item needs a string sku and a numeric quantity');
    }
    return { sku, quantity };
  });
}

function couponFrom(body: Record<string, unknown>): Coupon | undefined {
  if (body.couponCode === undefined) return undefined;
  const coupon = typeof body.couponCode === 'string' ? PROMOTIONS[body.couponCode.trim().toUpperCase()] : undefined;
  if (!coupon) throw new HttpError(422, 'That coupon code is not valid');
  return coupon;
}

export function buildRouter({ db, regions, commit }: AppOptions): Router {
  const byCode = new Map(regions.map((region) => [region.region as string, region]));
  const regionFrom = (value: unknown): RegionConfig => {
    const region = byCode.get(typeof value === 'string' && value ? value : 'us');
    if (!region) throw new HttpError(400, `Unknown region; use one of ${[...byCode.keys()].join(', ')}`);
    return region;
  };
  const withCheckoutErrors = <T>(work: () => T): T => {
    try {
      return work();
    } catch (error) {
      if (error instanceof CheckoutError) throw new HttpError(422, error.message);
      throw error;
    }
  };

  return new Router()
    .on('GET', '/api/health', () => ({ status: 'ok' }))
    .on('GET', '/api/version', () => ({ commit }))
    .on('GET', '/api/products', ({ query }) => {
      const region = regionFrom(query.get('region'));
      const requested = query.get('category');
      let category: Category | undefined;
      if (requested) {
        if (!isCategory(requested)) throw new HttpError(400, `Unknown category ${requested}`);
        category = requested;
      }
      const products = listProducts({ category, search: query.get('q') ?? undefined });
      return { region: region.region, currency: region.currency, products: products.map((p) => productView(p, region)) };
    })
    .on('GET', '/api/products/:sku', ({ params, query }) => {
      const product = getProduct(params.sku ?? '');
      if (!product) throw new HttpError(404, `No product ${params.sku}`);
      return productView(product, regionFrom(query.get('region')));
    })
    .on('POST', '/api/quote', async ({ req }) => {
      const body = (await readJson(req)) as Record<string, unknown>;
      return withCheckoutErrors(() => quote(parseCart(body), regionFrom(body.region), couponFrom(body)));
    })
    .on('POST', '/api/orders', async ({ req, res }) => {
      const body = (await readJson(req)) as Record<string, unknown>;
      const email = typeof body.email === 'string' ? body.email.trim() : '';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, 'A valid email is required');
      const giftMessage = body.giftMessage === undefined ? null : String(body.giftMessage).trim();
      if (giftMessage !== null && giftMessage.length > 200) throw new HttpError(400, 'Gift messages are limited to 200 characters');
      const priced = withCheckoutErrors(() => quote(parseCart(body), regionFrom(body.region), couponFrom(body)));
      const order = saveOrder(db, priced, email, giftMessage || null);
      sendJson(res, 201, { id: order.id, total: order.total, currency: order.currency });
    })
    .on('GET', '/api/orders/:id', ({ params }) => {
      const order = findOrder(db, params.id ?? '');
      if (!order) throw new HttpError(404, 'Order not found');
      return order;
    });
}
