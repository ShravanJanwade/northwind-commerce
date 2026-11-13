import { CATEGORIES, type Product } from '@northwind/catalog';
import type { RegionConfig } from '@northwind/config';
import { formatMoney } from '@northwind/money';
import { regionalPrice } from '@northwind/pricing';

export interface Release {
  commit: string;
  builtAt: string;
}

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ENTITIES[char] ?? char);
}

export function productPath(product: Product): string {
  return `p/${product.sku.toLowerCase()}.html`;
}

function taxNote(region: RegionConfig): string {
  return region.taxIncluded
    ? `Prices include ${region.taxLabel} at ${Math.round(region.taxRate * 1000) / 10}%.`
    : `${region.taxLabel} is added at checkout.`;
}

function layout(region: RegionConfig, release: Release, title: string, body: string, root = ''): string {
  return `<!doctype html>
<html lang="${escapeHtml(region.locale)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} · Northwind Coffee &amp; Tea</title>
<link rel="stylesheet" href="${root}assets/site.css">
</head>
<body>
<header>
  <a class="brand" href="${root}index.html">Northwind Coffee &amp; Tea</a>
  <span class="region">${escapeHtml(region.name)} · ${escapeHtml(region.currency)}</span>
</header>
<main>
${body}
</main>
<footer>
  <p>${escapeHtml(taxNote(region))} Free shipping from ${escapeHtml(
    formatMoney({ amount: region.freeShippingFrom, currency: region.currency }, region.locale),
  )}.</p>
  <p>Questions? <a href="mailto:${escapeHtml(region.supportEmail)}">${escapeHtml(region.supportEmail)}</a> ·
  Release ${escapeHtml(release.commit.slice(0, 7))}</p>
</footer>
</body>
</html>
`;
}

function card(product: Product, region: RegionConfig): string {
  const price = formatMoney(regionalPrice(product, region), region.locale);
  return `<article class="card">
  <a href="${productPath(product)}">${escapeHtml(product.name)}</a>
  <span class="muted">${escapeHtml(product.description)}</span>
  ${product.stock > 0 ? `<span class="price">${escapeHtml(price)}</span>` : '<span class="sold-out">Sold out</span>'}
</article>`;
}

export function renderHome(products: readonly Product[], region: RegionConfig, release: Release): string {
  const sections = CATEGORIES.map((category) => {
    const items = products.filter((product) => product.category === category);
    if (items.length === 0) return '';
    return `<h2>${escapeHtml(category)}</h2>\n<div class="grid">\n${items.map((p) => card(p, region)).join('\n')}\n</div>`;
  }).join('\n');
  return layout(region, release, 'Shop', `<h1>Freshly roasted, shipped from ${escapeHtml(region.name)}</h1>\n${sections}`);
}

export function renderProduct(product: Product, region: RegionConfig, release: Release): string {
  const price = formatMoney(regionalPrice(product, region), region.locale);
  const body = `<h1>${escapeHtml(product.name)}</h1>
<p class="muted">${escapeHtml(product.description)}</p>
<p class="price">${product.stock > 0 ? escapeHtml(price) : 'Sold out'}</p>
<p class="muted">SKU ${escapeHtml(product.sku)} · ${product.weightGrams} g shipped</p>
<p><a href="../index.html">Back to the shop</a></p>`;
  return layout(region, release, product.name, body, '../');
}

export function renderNotFound(region: RegionConfig, release: Release): string {
  // Served for any missing path, so its links are absolute.
  return layout(
    region,
    release,
    'Not found',
    '<h1>That page is not on the shelf</h1>\n<p><a href="/index.html">Back to the shop</a></p>',
    '/',
  );
}
