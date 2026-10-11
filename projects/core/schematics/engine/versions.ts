import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { readOwnVersion } from './manifest/manifest';

/** The release versions a run pins. */
export interface ReleaseVersions {
  readonly cngx: string;
  readonly mcp: string;
  readonly eslintPlugin: string;
}

export interface ResolvedVersions {
  readonly versions: ReleaseVersions;
  /** Set when `versions.json` is missing and the fallback answered. */
  readonly warning?: string;
}

// The versions a local build (no `versions.json`) pins; a spec keeps them in
// step with packages/mcp and packages/eslint-plugin.
export const DEFAULT_MCP_VERSION = '0.2.0';
export const DEFAULT_ESLINT_PLUGIN_VERSION = '0.2.0';

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The pins of a `versions.json` body; `undefined` when a pin is missing. */
export function parseVersions(content: string): ReleaseVersions | undefined {
  const parsed: unknown = JSON.parse(content);
  if (!isRecord(parsed)) {
    return undefined;
  }
  const { cngx, mcp, eslintPlugin } = parsed;
  if (typeof cngx !== 'string' || typeof mcp !== 'string' || typeof eslintPlugin !== 'string') {
    return undefined;
  }
  return { cngx, mcp, eslintPlugin };
}

export type ReadText = (path: string) => string | undefined;

const readIfPresent: ReadText = (path) => {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return undefined;
  }
};

/**
 * The versions `scripts/publish.mjs` wrote next to the bundles
 * (`dist/core/schematics/versions.json`). A local build has none: the cngx
 * version then comes from the package's own manifest, the others from the
 * defaults above, and the run says so.
 */
export function resolveVersions(bundleDir: string, read: ReadText = readIfPresent): ResolvedVersions {
  const path = join(bundleDir, '..', 'versions.json');
  const content = read(path);
  const published = content === undefined ? undefined : parseVersions(content);
  if (published !== undefined) {
    return { versions: published };
  }
  return {
    versions: { cngx: readOwnVersion(bundleDir), mcp: DEFAULT_MCP_VERSION, eslintPlugin: DEFAULT_ESLINT_PLUGIN_VERSION },
    warning: `No usable ${path}; pinning @cngx/mcp@${DEFAULT_MCP_VERSION} and @cngx/eslint-plugin@${DEFAULT_ESLINT_PLUGIN_VERSION} (a local build).`,
  };
}
