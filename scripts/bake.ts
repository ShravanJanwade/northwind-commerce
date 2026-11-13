// Watches a freshly deployed environment before production gets the same
// release: node scripts/bake.ts <base-url> <expected-commit> <minutes>
//
// Every 30 seconds it checks that the environment still serves this release,
// that the catalog parses and that the home page renders. Two failed checks
// in a row end the bake, and the release never reaches production.

const [baseArg, expected, minutesArg] = process.argv.slice(2);
const minutes = Number(minutesArg);
if (!baseArg || !expected || !Number.isFinite(minutes) || minutes < 0) {
  console.error('Usage: bake.ts <base-url> <expected-commit> <minutes>');
  process.exit(2);
}
const base = baseArg.endsWith('/') ? baseArg : `${baseArg}/`;
const INTERVAL_MS = 30_000;

async function healthy(): Promise<string | null> {
  try {
    const get = (path: string) =>
      fetch(new URL(path, base), { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
    const version = (await (await get('version.json')).json()) as { commit?: string };
    if (version.commit !== expected) return `serving ${version.commit ?? 'nothing'}, expected ${expected}`;
    const catalog = (await (await get('api/products.json')).json()) as { products?: unknown[] };
    if (!Array.isArray(catalog.products) || catalog.products.length === 0) return 'catalog is empty';
    const home = await get('index.html');
    if (!home.ok) return `home page answered HTTP ${home.status}`;
    return null;
  } catch (error) {
    return (error as Error).message;
  }
}

const clock = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function fail(message: string): never {
  if (process.env.GITHUB_ACTIONS) console.log(`::error title=Bake failed::${message}`);
  console.error(message);
  process.exit(1);
}

const started = Date.now();
const total = minutes * 60_000;
let failuresInARow = 0;
let lastProblem: string | null;
let checks = 0;
for (;;) {
  const problem = await healthy();
  checks += 1;
  lastProblem = problem;
  const elapsed = Date.now() - started;
  if (problem) {
    failuresInARow += 1;
    console.log(`${clock(elapsed)} / ${clock(total)}  check ${checks} failed: ${problem}`);
    if (failuresInARow >= 2) fail(`Staging became unhealthy during the bake: ${problem}`);
  } else {
    failuresInARow = 0;
    console.log(`${clock(elapsed)} / ${clock(total)}  check ${checks} ok: serving ${expected.slice(0, 7)}`);
  }
  // A bake never ends on a failed check: look again before deciding.
  if (elapsed >= total && !problem) break;
  await new Promise((resolve) =>
    setTimeout(resolve, problem ? 5_000 : Math.min(INTERVAL_MS, Math.max(1_000, total - elapsed))),
  );
}
if (lastProblem) fail(`Staging was unhealthy at the end of the bake: ${lastProblem}`);
console.log(`Staging stayed healthy for ${clock(Date.now() - started)} across ${checks} checks.`);
