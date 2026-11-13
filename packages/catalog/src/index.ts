import { PRODUCTS, type Category, type Product } from './products.ts';

export type { Category, Product };
export { PRODUCTS };

export const CATEGORIES: readonly Category[] = ['coffee', 'tea', 'brewing', 'mugs'];

export interface ProductQuery {
  category?: Category;
  /** Case-insensitive match against the name and description. */
  search?: string;
  inStockOnly?: boolean;
}

export function listProducts(query: ProductQuery = {}): Product[] {
  const needle = query.search?.trim().toLowerCase();
  return PRODUCTS.filter(
    (product) =>
      (!query.category || product.category === query.category) &&
      (!query.inStockOnly || product.stock > 0) &&
      (!needle || `${product.name} ${product.description}`.toLowerCase().includes(needle)),
  );
}

export function getProduct(sku: string): Product | undefined {
  return PRODUCTS.find((product) => product.sku === sku);
}

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}
