import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { listProducts } from '@northwind/catalog';
import type { RegionConfig } from '@northwind/config';
import { regionalPrice } from '@northwind/pricing';
import { productPath, renderHome, renderNotFound, renderProduct, type Release } from './render.ts';
import { SITE_CSS } from './styles.ts';

export interface BuildResult {
  region: string;
  outDir: string;
  files: string[];
}

/** Writes one region's complete static site into `outDir`, replacing what was there. */
export function buildStorefront(region: RegionConfig, outDir: string, release: Release): BuildResult {
  rmSync(outDir, { recursive: true, force: true });
  const files: string[] = [];
  const write = (path: string, content: string) => {
    const target = join(outDir, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
    files.push(path);
  };

  const products = listProducts();
  write('index.html', renderHome(products, region, release));
  for (const product of products) write(productPath(product), renderProduct(product, region, release));
  write('404.html', renderNotFound(region, release));
  write('assets/site.css', SITE_CSS);
  write(
    'api/products.json',
    JSON.stringify(
      {
        region: region.region,
        currency: region.currency,
        products: products.map((product) => ({
          sku: product.sku,
          name: product.name,
          category: product.category,
          inStock: product.stock > 0,
          price: regionalPrice(product, region).amount,
        })),
      },
      null,
      2,
    ),
  );
  write('version.json', JSON.stringify({ region: region.region, ...release }, null, 2));
  return { region: region.region, outDir, files };
}
