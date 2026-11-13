CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  region TEXT NOT NULL,
  currency TEXT NOT NULL,
  email TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  discount_total INTEGER NOT NULL,
  shipping INTEGER NOT NULL,
  tax INTEGER NOT NULL,
  tax_included INTEGER NOT NULL,
  total INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_orders_created ON orders (created_at);
