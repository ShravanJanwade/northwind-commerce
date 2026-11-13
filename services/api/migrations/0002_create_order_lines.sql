CREATE TABLE order_lines (
  order_id TEXT NOT NULL REFERENCES orders (id),
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  line_total INTEGER NOT NULL,
  PRIMARY KEY (order_id, sku)
);
