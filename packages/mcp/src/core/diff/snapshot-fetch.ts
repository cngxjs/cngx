// Fail-safe fetch of a non-bundled `documentation.json` from the GitHub Release
// assets. `gh release download` is tried first (it honours the user's auth and
// proxy setup); any `gh` failure - not installed, not authenticated, or anything
// else - falls through to a plain HTTPS GET of the public asset URL. This is the
// server's only network/shell touch. It never throws across its boundary: every
// failure returns a typed result the tool surfaces as data. Both paths abort after
// SNAPSHOT_FETCH_TIMEOUT_MS. The `gh` download is pinned to the cngx repo with
// `--repo`: without it, `gh` resolves the repo from the git remote of the CURRENT
// working directory - and `npx @cngx/mcp` runs inside the consumer's checkout.

import { execFile } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { SnapshotFetchFailureReason } from './types.js';

export type SnapshotFetchResult =
  | { ok: true; path: string }
  | { ok: false; reason: SnapshotFetchFailureReason; message: string };

/** The fetch a resolver depends on: one release version in, a snapshot path or a typed failure out. */
export type FetchSnapshot = (version: string) => Promise<SnapshotFetchResult>;

/** What the HTTPS path reads off a response. `body` is only read for a 200. */
export interface HttpGetResponse {
  status: number;
  body: string;
}

/**
 * Injectable side-effect seam so the classification is unit-testable without
 * spawning `gh` or touching the network. Production wiring is {@link createDefaultDeps}.
 */
export interface SnapshotFetchDeps {
  /** Run `gh` with `args`; rejects on any failure, including the timeout. */
  runGh: (args: string[]) => Promise<void>;
  /** GET `url`; rejects on a transport failure or the timeout. */
  httpGet: (url: string) => Promise<HttpGetResponse>;
  /** Root the release asset URLs hang off, without a trailing slash. */
  releaseBaseUrl: string;
  /** Write a fetched snapshot body to `path`. */
  writeFile: (path: string, body: string) => void;
  /** Create a fresh temp directory and return its path. */
  makeTempDir: () => string;
}

/** The release source. Never derived from the working directory's git remote. */
export const CNGX_REPO = 'cngxjs/cngx';

/** How long either path may take before it counts as a `network` failure. */
export const SNAPSHOT_FETCH_TIMEOUT_MS = 15_000;

/** Public download root of the cngx release assets. */
export const RELEASE_BASE_URL = `https://github.com/${CNGX_REPO}/releases/download`;

// A release tag: major.minor.patch plus an optional prerelease whose ids may
// contain hyphens, as semver permits. No `/`, `\` or `..` can pass it.
const RELEASE_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

/**
 * Whether `version` is a release version. Checked before a version reaches a
 * temp path, a `gh` argument or a URL.
 */
export function isReleaseVersion(version: string): boolean {
  return RELEASE_VERSION.test(version) && !version.includes('..');
}

/**
 * The exact `gh` argv for one snapshot download. Exported so the spec pins the
 * `--repo` pin itself - the standalone `npx` contract lives in these args.
 */
export function ghDownloadArgs(version: string, dir: string): string[] {
  return ['release', 'download', `v${version}`, '--repo', CNGX_REPO, '--pattern', 'documentation.json', '--dir', dir];
}

/** The public asset URL of `documentation.json` for release `v<version>`. */
export function releaseAssetUrl(baseUrl: string, version: string): string {
  return `${baseUrl}/v${version}/documentation.json`;
}

export interface DefaultDepsOptions {
  timeoutMs?: number;
  ghBinary?: string;
  releaseBaseUrl?: string;
}

const execFileAsync = promisify(execFile);

/** The production deps. Options exist so the timeout spec can shrink the clock and point at local stand-ins. */
export function createDefaultDeps({
  timeoutMs = SNAPSHOT_FETCH_TIMEOUT_MS,
  ghBinary = 'gh',
  releaseBaseUrl = RELEASE_BASE_URL,
}: DefaultDepsOptions = {}): SnapshotFetchDeps & { timeoutMs: number } {
  return {
    timeoutMs,
    runGh: async (args) => {
      await execFileAsync(ghBinary, args, { timeout: timeoutMs });
    },
    httpGet: async (url) => {
      const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
      return { status: response.status, body: response.status === 200 ? await response.text() : '' };
    },
    releaseBaseUrl,
    writeFile: (path, body) => writeFileSync(path, body),
    makeTempDir: () => mkdtempSync(join(tmpdir(), 'cngx-mcp-snapshot-')),
  };
}

const defaultDeps = createDefaultDeps();

/**
 * Map a caught `gh` failure to a typed reason. Exported so the classification is
 * pinned by the spec directly. A `gh` binary that is not on PATH throws `ENOENT`;
 * a child killed by the timeout is a `network` failure; everything else is read
 * off the process' stderr/message.
 */
export function classifyGhFailure(error: unknown): { reason: SnapshotFetchFailureReason; message: string } {
  if (isEnoent(error)) {
    return { reason: 'gh-missing', message: 'The `gh` CLI is not installed or not on PATH.' };
  }
  if (isTimedOut(error)) {
    return { reason: 'network', message: 'The `gh` download timed out.' };
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

export async function fetchSnapshot(version: string, deps: SnapshotFetchDeps = defaultDeps): Promise<SnapshotFetchResult> {
  if (!isReleaseVersion(version)) {
    return {
      ok: false,
      reason: 'asset-missing',
      message: `"${version}" is not a release version; expected <major>.<minor>.<patch> with an optional -<prerelease>.`,
    };
  }
  const dir = deps.makeTempDir();
  const path = join(dir, 'documentation.json');
  let ghMessage: string;
  try {
    await deps.runGh(ghDownloadArgs(version, dir));
    return { ok: true, path };
  } catch (error) {
    ghMessage = classifyGhFailure(error).message;
  }

  const url = releaseAssetUrl(deps.releaseBaseUrl, version);
  try {
    const response = await deps.httpGet(url);
    if (response.status === 404) {
      return { ok: false, reason: 'asset-missing', message: `gh: ${ghMessage} https: ${url} returned 404.` };
    }
    if (response.status !== 200) {
      return { ok: false, reason: 'network', message: `gh: ${ghMessage} https: ${url} returned ${response.status}.` };
    }
    deps.writeFile(path, response.body);
    return { ok: true, path };
  } catch (error) {
    return { ok: false, reason: 'network', message: `gh: ${ghMessage} https: ${extractMessage(error)}` };
  }
}

function isEnoent(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'ENOENT';
}

function isTimedOut(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const { killed, code } = error as { killed?: boolean; code?: unknown };
  return killed === true || code === 'ETIMEDOUT';
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
