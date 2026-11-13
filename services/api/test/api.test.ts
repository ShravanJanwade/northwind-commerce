import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { loadAllRegions } from '@northwind/config';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate, openDatabase } from '../src/db.ts';
import { createApiServer } from '../src/server.ts';

let server: Server;
let base: string;

beforeAll(async () => {
  const db = openDatabase(':memory:');
  migrate(db);
  server = createApiServer({ db, regions: loadAllRegions(), commit: 'test-commit' });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

interface ProductsBody {
  currency: string;
  products: { price: { formatted: string } }[];
}
interface QuoteBody {
  discounts: { code: string }[];
}
interface OrderBody {
  giftMessage: string | null;
  lines: { sku: string }[];
  subtotal: number;
  discountTotal: number;
  total: number;
}

const json = async <T>(response: Response) => (await response.json()) as T;

const post = (path: string, body: unknown) =>
  fetch(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

describe('orders API', () => {
  it('reports health and version', async () => {
    expect(await (await fetch(`${base}/api/health`)).json()).toEqual({ status: 'ok' });
    expect(await (await fetch(`${base}/api/version`)).json()).toEqual({ commit: 'test-commit' });
  });

  it('lists products with regional prices', async () => {
    const response = await fetch(`${base}/api/products?region=eu&category=coffee`);
    const body = await json<ProductsBody>(response);
    expect(body.currency).toBe('EUR');
    expect(body.products).toHaveLength(4);
    expect(body.products[0]!.price.formatted.replace(/\s/g, ' ')).toBe('13,79 €');
  });

  it('returns 404 for an unknown product and route', async () => {
    expect((await fetch(`${base}/api/products/NW-NOPE`)).status).toBe(404);
    expect((await fetch(`${base}/api/nothing`)).status).toBe(404);
  });

  it('quotes a cart with a promotion', async () => {
    const response = await post('/api/quote', {
      region: 'us',
      items: [{ sku: 'NW-MUG-001', quantity: 3 }],
      couponCode: 'welcome10',
    });
    expect(response.status).toBe(200);
    const q = await json<QuoteBody>(response);
    expect(q.discounts.map((d) => d.code)).toEqual(['volume:NW-MUG-001', 'coupon:WELCOME10']);
  });

  it('places an order and reads it back', async () => {
    const created = await post('/api/orders', {
      region: 'ca',
      email: 'ada@example.com',
      giftMessage: 'Happy birthday, Grace!',
      items: [
        { sku: 'NW-COF-002', quantity: 2 },
        { sku: 'NW-BRW-001', quantity: 1 },
      ],
    });
    expect(created.status).toBe(201);
    const { id, currency } = await json<{ id: string; currency: string }>(created);
    expect(currency).toBe('CAD');

    const order = await json<OrderBody>(await fetch(`${base}/api/orders/${id}`));
    expect(order.lines.map((l) => l.sku)).toEqual(['NW-BRW-001', 'NW-COF-002']);
    expect(order.giftMessage).toBe('Happy birthday, Grace!');
    expect(order.total).toBeGreaterThan(order.subtotal - order.discountTotal);
  });

  it('rejects bad input with a reason', async () => {
    expect((await post('/api/orders', { region: 'us', email: 'nope', items: [] })).status).toBe(400);
    const empty = await post('/api/quote', { region: 'us', items: [] });
    expect(empty.status).toBe(422);
    expect(await empty.json()).toEqual({ error: 'The cart is empty' });
    expect((await post('/api/quote', { region: 'xx', items: [] })).status).toBe(400);
  });
});

describe('migrations', () => {
  it('apply once and record what ran', () => {
    const db = openDatabase(':memory:');
    expect(migrate(db)).toEqual([
      '0001_create_orders.sql',
      '0002_create_order_lines.sql',
      '0003_add_gift_message.sql',
      '0004_add_delivery_notes.sql',
    ]);
    expect(migrate(db)).toEqual([]);
  });
});
