import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { readOwnPeerRange, readOwnVersion } from './manifest/manifest';
import { isRecord } from './plan/text';

/** The release versions a run pins. */
export interface ReleaseVersions {
  readonly cngx: string;
  readonly mcp: string;
  readonly eslintPlugin: string;
  /** The `@angular/core` range `@cngx/core` peers on; `ng add` refuses an older app. */
  readonly angular: string;
}

export interface ResolvedVersions {
  readonly versions: ReleaseVersions;
  /** Set when `versions.json` is missing and the fallback answered. */
  readonly warning?: string;
}

/**
 * The version an unstamped local build carries. `publish` and `pack-libs`
 * replace every occurrence of the literal in the bundles, so it is joined at
 * runtime: a stamped bundle must still recognise the placeholder.
 */
export const PLACEHOLDER_VERSION = ['0.0.0', 'PLACEHOLDER'].join('-');

/** Whether `version` is the placeholder of an unstamped local build, which no registry serves. */
export function isUnstampedVersion(version: string): boolean {
  return version === PLACEHOLDER_VERSION;
}

// The versions a local build (no `versions.json`) pins; a spec keeps them in
// step with packages/mcp and packages/eslint-plugin.
export const DEFAULT_MCP_VERSION = '0.2.0';
export const DEFAULT_ESLINT_PLUGIN_VERSION = '0.2.0';

/** The pins of a `versions.json` body; `undefined` when it is not JSON or a pin is missing. */
export function parseVersions(content: string): ReleaseVersions | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return undefined;
  }
  if (!isRecord(parsed)) {
    return undefined;
  }
  const { cngx, mcp, eslintPlugin, angular } = parsed;
  if (
    typeof cngx !== 'string' ||
    typeof mcp !== 'string' ||
    typeof eslintPlugin !== 'string' ||
    typeof angular !== 'string'
  ) {
    return undefined;
  }
  return { cngx, mcp, eslintPlugin, angular };
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
 * version and the Angular range then come from the package's own manifest,
 * the other pins from the defaults above, and the run says so.
 */
export function resolveVersions(bundleDir: string, read: ReadText = readIfPresent): ResolvedVersions {
  const path = join(bundleDir, '..', 'versions.json');
  const content = read(path);
  const published = content === undefined ? undefined : parseVersions(content);
  if (published !== undefined) {
    return { versions: published };
  }
  return {
    versions: {
      cngx: readOwnVersion(bundleDir),
      mcp: DEFAULT_MCP_VERSION,
      eslintPlugin: DEFAULT_ESLINT_PLUGIN_VERSION,
      angular: readOwnPeerRange(bundleDir, '@angular/core'),
    },
    warning: `No usable versions.json next to the schematics; pinning @cngx/mcp@${DEFAULT_MCP_VERSION} and @cngx/eslint-plugin@${DEFAULT_ESLINT_PLUGIN_VERSION} (a local build).`,
  };
}
