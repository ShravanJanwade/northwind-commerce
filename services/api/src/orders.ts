import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { Quote } from '@northwind/checkout';

export interface StoredOrder {
  id: string;
  region: string;
  currency: string;
  email: string;
  subtotal: number;
  discountTotal: number;
  shipping: number;
  tax: number;
  taxIncluded: boolean;
  total: number;
  createdAt: string;
  lines: { sku: string; name: string; quantity: number; unitPrice: number; lineTotal: number }[];
}

interface OrderRow {
  id: string;
  region: string;
  currency: string;
  email: string;
  subtotal: number;
  discount_total: number;
  shipping: number;
  tax: number;
  tax_included: number;
  total: number;
  created_at: string;
}

interface LineRow {
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export function saveOrder(db: DatabaseSync, quote: Quote, email: string): StoredOrder {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  db.exec('BEGIN');
  try {
    db.prepare(
      `INSERT INTO orders (id, region, currency, email, subtotal, discount_total, shipping, tax, tax_included, total, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      quote.region,
      quote.currency,
      email,
      quote.subtotal.amount,
      quote.discountTotal.amount,
      quote.shipping.amount,
      quote.tax.amount.amount,
      quote.tax.included ? 1 : 0,
      quote.total.amount,
      createdAt,
    );
    const insertLine = db.prepare(
      'INSERT INTO order_lines (order_id, sku, name, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?)',
    );
    for (const line of quote.lines) {
      insertLine.run(id, line.sku, line.name, line.quantity, line.unitPrice.amount, line.lineTotal.amount);
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return findOrder(db, id)!;
}

export function findOrder(db: DatabaseSync, id: string): StoredOrder | null {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow | undefined;
  if (!order) return null;
  const lines = db
    .prepare('SELECT sku, name, quantity, unit_price, line_total FROM order_lines WHERE order_id = ? ORDER BY sku')
    .all(id) as unknown as LineRow[];
  return {
    id: order.id,
    region: order.region,
    currency: order.currency,
    email: order.email,
    subtotal: order.subtotal,
    discountTotal: order.discount_total,
    shipping: order.shipping,
    tax: order.tax,
    taxIncluded: order.tax_included === 1,
    total: order.total,
    createdAt: order.created_at,
    lines: lines.map((line) => ({
      sku: line.sku,
      name: line.name,
      quantity: line.quantity,
      unitPrice: line.unit_price,
      lineTotal: line.line_total,
    })),
  };
}
