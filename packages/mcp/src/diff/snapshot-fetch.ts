// Fail-safe fetch of a non-bundled `documentation.json` from the M0 GitHub Release
// assets via `gh release download`. This is the server's only network/shell touch,
// scoped to `migrate_usage`. It never throws across its boundary: a missing `gh`,
// no network, or an absent asset returns a typed failure the tool surfaces as data.

import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { SnapshotFetchFailureReason } from './types.js';

export type SnapshotFetchResult =
  | { ok: true; path: string }
  | { ok: false; reason: SnapshotFetchFailureReason; message: string };

/**
 * Injectable side-effect seam so the classification is unit-testable without
 * spawning `gh` or touching the network. Production wiring is {@link defaultDeps}.
 */
export interface SnapshotFetchDeps {
  /** Download `documentation.json` for `v<version>` into `dir`; throws on any failure. */
  download: (version: string, dir: string) => void;
  /** Create a fresh temp directory and return its path. */
  makeTempDir: () => string;
}

const defaultDeps: SnapshotFetchDeps = {
  download: (version, dir) =>
    execFileSync(
      'gh',
      ['release', 'download', `v${version}`, '--pattern', 'documentation.json', '--dir', dir],
      { stdio: 'pipe' },
    ),
  makeTempDir: () => mkdtempSync(join(tmpdir(), 'cngx-mcp-snapshot-')),
};

/**
 * Map a caught `gh` failure to a typed reason. Exported so the classification is
 * pinned by the spec directly. A `gh` binary that is not on PATH throws `ENOENT`;
 * everything else is read off the process' stderr/message.
 */
export function classifyGhFailure(error: unknown): { reason: SnapshotFetchFailureReason; message: string } {
  if (isEnoent(error)) {
    return { reason: 'gh-missing', message: 'The `gh` CLI is not installed or not on PATH.' };
  }
  const message = extractMessage(error);
  const lower = message.toLowerCase();
  if (/network|timeout|timed out|dial tcp|connection|no such host|lookup|dns|unreachable|refused/.test(lower)) {
    return { reason: 'network', message };
  }
  // An unknown non-network failure is almost always the version having no release
  // or no asset; `asset-missing` is the safest consumer-facing reason.
  return { reason: 'asset-missing', message };
}

export function fetchSnapshot(version: string, deps: SnapshotFetchDeps = defaultDeps): SnapshotFetchResult {
  const dir = deps.makeTempDir();
  try {
    deps.download(version, dir);
  } catch (error) {
    return { ok: false, ...classifyGhFailure(error) };
  }
  return { ok: true, path: join(dir, 'documentation.json') };
}

function isEnoent(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'ENOENT';
}

function extractMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const stderr = (error as { stderr?: string | Buffer }).stderr;
    if (stderr != null) {
      return stderr.toString().trim();
    }
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }
  return String(error);
}
