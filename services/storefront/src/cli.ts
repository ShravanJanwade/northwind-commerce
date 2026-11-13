// Builds storefronts: `--all`, or `--region <code>`, into `--out <dir>/<code>`.
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { ConfigurationError, loadRegion, REGIONS } from '@northwind/config';
import { buildStorefront } from './build.ts';

const { values } = parseArgs({
  options: {
    all: { type: 'boolean', default: false },
    region: { type: 'string' },
    out: { type: 'string', default: 'dist' },
  },
});

const regions = values.all ? [...REGIONS] : values.region ? [values.region] : [];
if (regions.length === 0) {
  console.error('Usage: cli.ts --all | --region <us|ca|eu> [--out dist]');
  process.exit(2);
}

const release = {
  commit: process.env.GITHUB_SHA ?? process.env.GIT_COMMIT ?? 'local',
  builtAt: new Date().toISOString(),
};

for (const code of regions) {
  try {
    const result = buildStorefront(loadRegion(code), join(values.out, code), release);
    console.log(`Built ${code}: ${result.files.length} files in ${result.outDir}`);
  } catch (error) {
    if (!(error instanceof ConfigurationError)) throw error;
    // An annotation puts the reason on the run summary as well as in the log.
    if (process.env.GITHUB_ACTIONS) console.log(`::error title=${code} configuration::${error.message}`);
    console.error(`${error.name}: ${error.message}`);
    process.exit(1);
  }
}
