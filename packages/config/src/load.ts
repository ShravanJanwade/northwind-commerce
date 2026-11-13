import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ConfigurationError, parseRegionConfig, REGIONS, type RegionConfig } from './region.ts';

/** config/regions at the repository root. */
export const DEFAULT_CONFIG_DIR = fileURLToPath(new URL('../../../config/regions/', import.meta.url));

export function loadRegion(region: string, dir: string = DEFAULT_CONFIG_DIR): RegionConfig {
  const file = `${dir.replace(/[\\/]+$/, '')}/${region}.json`;
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    throw new ConfigurationError(`No configuration file for region "${region}" at ${file}`);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    throw new ConfigurationError(`Region "${region}" configuration is not valid JSON: ${(error as Error).message}`);
  }
  return parseRegionConfig(raw, region);
}

export function loadAllRegions(dir: string = DEFAULT_CONFIG_DIR): RegionConfig[] {
  return REGIONS.map((region) => loadRegion(region, dir));
}
