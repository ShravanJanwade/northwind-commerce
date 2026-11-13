// Reads config/deploy/<environment>.json and writes its values as step
// outputs: node scripts/deploy-settings.ts <environment>
//
// These are deployment settings (cache lifetimes), separate from the region's
// storefront configuration, and only a deploy reads them.
import { appendFileSync, readFileSync } from 'node:fs';

const REQUIRED = ['htmlCacheSeconds', 'assetCacheSeconds', 'catalogCacheSeconds'] as const;
// Minutes a release spends in this environment before production gets it.
const OPTIONAL = ['bakeMinutes'] as const;

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

const environment = process.argv[2];
if (!environment || !/^[a-z0-9-]+$/.test(environment)) {
  console.error('Usage: deploy-settings.ts <environment>');
  process.exit(2);
}

try {
  const file = new URL(`../config/deploy/${environment}.json`, import.meta.url);
  let settings: Record<string, unknown>;
  try {
    settings = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  } catch (error) {
    throw new ConfigurationError(`Cannot read deploy settings for ${environment}: ${(error as Error).message}`);
  }
  const lines: string[] = [];
  for (const key of REQUIRED) {
    const value = settings[key];
    if (value === undefined) throw new ConfigurationError(`${environment} is missing deploy setting "${key}"`);
    if (!Number.isInteger(value) || (value as number) < 0) {
      throw new ConfigurationError(`${environment} deploy setting "${key}" must be a whole number of seconds`);
    }
    lines.push(`${key}=${value}`);
  }
  for (const key of OPTIONAL) {
    const value = settings[key];
    if (value === undefined) continue;
    if (!Number.isInteger(value) || (value as number) < 0) {
      throw new ConfigurationError(`${environment} deploy setting "${key}" must be a whole number`);
    }
    lines.push(`${key}=${value}`);
  }
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`);
  console.log(`Deploy settings for ${environment}: ${lines.join(', ')}`);
} catch (error) {
  if (!(error instanceof ConfigurationError)) throw error;
  if (process.env.GITHUB_ACTIONS) console.log(`::error title=${environment} deploy settings::${error.message}`);
  console.error(`${error.name}: ${error.message}`);
  process.exit(1);
}
