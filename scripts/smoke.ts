// Checks a deployed storefront: node scripts/smoke.ts <base-url> [expected-commit]
//
// The version stamp has to match the commit being deployed, the JSON catalog
// has to parse and be non-empty, and the home page has to render. Storage can
// take a few seconds to serve new blobs, so each check retries briefly.

const [baseArg, expected] = process.argv.slice(2);
if (!baseArg) {
  console.error('Usage: smoke.ts <base-url> [expected-commit]');
  process.exit(2);
}
const base = baseArg.endsWith('/') ? baseArg : `${baseArg}/`;

async function fetchWithRetry(path: string, attempts = 6): Promise<Response> {
  let last = '';
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(new URL(path, base), { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
      if (response.ok) return response;
      last = `HTTP ${response.status}`;
    } catch (error) {
      last = (error as Error).message;
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000 * attempt));
  }
  throw new Error(`${path} did not answer: ${last}`);
}

const failures: string[] = [];
async function check(name: string, run: () => Promise<void>) {
  try {
    await run();
    console.log(`ok   ${name}`);
  } catch (error) {
    failures.push(`${name}: ${(error as Error).message}`);
    console.log(`FAIL ${name}: ${(error as Error).message}`);
  }
}

await check('version stamp', async () => {
  const version = (await (await fetchWithRetry('version.json')).json()) as { commit?: string };
  if (expected && version.commit !== expected) {
    throw new Error(`version.json reports ${version.commit}, expected ${expected}`);
  }
});

await check('catalog', async () => {
  const catalog = (await (await fetchWithRetry('api/products.json')).json()) as { products?: unknown[] };
  if (!Array.isArray(catalog.products) || catalog.products.length === 0) throw new Error('catalog is empty');
});

await check('home page', async () => {
  const html = await (await fetchWithRetry('index.html')).text();
  if (!html.includes('Northwind Coffee')) throw new Error('home page is missing its title');
});

if (failures.length > 0) {
  console.error(`Smoke test failed for ${base}`);
  process.exit(1);
}
console.log(`Smoke test passed for ${base}`);
