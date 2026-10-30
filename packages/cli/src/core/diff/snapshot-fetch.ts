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
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { SnapshotFetchFailureReason } from './types.js';

/**
 * A fetch outcome. On success `dir` is the temp directory the fetch created for the
 * snapshot; the caller owns it from then on and removes it once the snapshot is read.
 * A failure has already removed it.
 */
export type SnapshotFetchResult =
  | { ok: true; path: string; dir?: string }
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
  /** Remove a temp directory made by `makeTempDir`, with everything in it. */
  removeDir: (dir: string) => void;
}

/** The release source. Never derived from the working directory's git remote. */
export const CNGX_REPO = 'cngxjs/cngx';

/** How long either path may take before it counts as a `network` failure. */
export const SNAPSHOT_FETCH_TIMEOUT_MS = 15_000;

/** Public download root of the cngx release assets. */
export const RELEASE_BASE_URL = `https://github.com/${CNGX_REPO}/releases/download`;

// A release tag: major.minor.patch without leading zeros, plus an optional
// prerelease of non-empty dot-separated ids, as semver defines them: a numeric id
// has no leading zero (`0` or `[1-9]\d*`), an alphanumeric id contains a letter
// or a hyphen. No `/`, `\` or `..` can pass it.
const PRERELEASE_ID = '(?:0|[1-9]\\d*|\\d*[A-Za-z-][0-9A-Za-z-]*)';
const RELEASE_VERSION = new RegExp(
  `^(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)(?:-${PRERELEASE_ID}(?:\\.${PRERELEASE_ID})*)?$`,
);

const EXPECTED_SHAPE = 'expected <major>.<minor>.<patch> with an optional -<prerelease>.';

/** The one "not a release version" message; it echoes the caller's original input. */
function notReleaseVersion(input: string, reason: string = EXPECTED_SHAPE): string {
  return `"${input}" is not a release version; ${reason}`;
}

/**
 * Whether `version` is a release version. Checked before a version reaches a
 * temp path, a `gh` argument or a URL.
 */
export function isReleaseVersion(version: string): boolean {
  return RELEASE_VERSION.test(version);
}

export type NormalizedVersion = { readonly ok: true; readonly version: string } | { readonly ok: false; readonly message: string };

/**
 * The one version contract the CLI and MCP share: trim, strip one leading `v` or
 * `V` (a pasted release tag), then require a release version. A message echoes
 * the caller's original input.
 */
export function normalizeReleaseVersion(input: string): NormalizedVersion {
  const trimmed = input.trim();
  const version = /^[vV]/.test(trimmed) ? trimmed.slice(1) : trimmed;
  if (version === '') {
    return { ok: false, message: notReleaseVersion(input, 'the version is blank.') };
  }
  if (!isReleaseVersion(version)) {
    return { ok: false, message: notReleaseVersion(input) };
  }
  return { ok: true, version };
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
      if (response.status !== 200) {
        // An unread body keeps the connection open until GC; cancel it so the socket is released now.
        await response.body?.cancel();
        return { status: response.status, body: '' };
      }
      return { status: 200, body: await response.text() };
    },
    releaseBaseUrl,
    writeFile: (path, body) => writeFileSync(path, body),
    makeTempDir: () => mkdtempSync(join(tmpdir(), 'cngx-snapshot-')),
    removeDir: removeTempDir,
  };
}

/** Production `removeDir`: a missing directory is not an error. */
export function removeTempDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

const defaultDeps = createDefaultDeps();

/**
 * The text a `gh` failure contributes to the combined gh-then-HTTPS message. The
 * HTTPS attempt decides the reason, so only the text is needed here (`gh-missing`
 * stays unproduced, accepted debt).
 */
function describeGhFailure(error: unknown): string {
  if (isEnoent(error)) {
    return 'The `gh` CLI is not installed or not on PATH.';
  }
  if (isTimedOut(error)) {
    return 'The `gh` download timed out.';
  }
  return extractMessage(error);
}

export async function fetchSnapshot(version: string, deps: SnapshotFetchDeps = defaultDeps): Promise<SnapshotFetchResult> {
  if (!isReleaseVersion(version)) {
    return { ok: false, reason: 'invalid-version', message: notReleaseVersion(version) };
  }
  let dir: string;
  try {
    dir = deps.makeTempDir();
  } catch (error) {
    return { ok: false, reason: 'asset-missing', message: `No temp directory for the snapshot: ${extractMessage(error)}` };
  }
  const result = await download(version, dir, deps);
  if (!result.ok) {
    removeQuietly(deps.removeDir, dir);
  }
  return result;
}

async function download(version: string, dir: string, deps: SnapshotFetchDeps): Promise<SnapshotFetchResult> {
  const path = join(dir, 'documentation.json');
  let ghMessage: string;
  try {
    await deps.runGh(ghDownloadArgs(version, dir));
    return { ok: true, path, dir };
  } catch (error) {
    ghMessage = describeGhFailure(error);
  }

  const url = releaseAssetUrl(deps.releaseBaseUrl, version);
  let body: string;
  try {
    const response = await deps.httpGet(url);
    if (response.status === 404) {
      return { ok: false, reason: 'asset-missing', message: `gh: ${ghMessage} https: ${url} returned 404.` };
    }
    if (response.status !== 200) {
      return { ok: false, reason: 'network', message: `gh: ${ghMessage} https: ${url} returned ${response.status}.` };
    }
    if (typeof response.body !== 'string' || response.body === '') {
      return { ok: false, reason: 'asset-missing', message: `gh: ${ghMessage} https: ${url} returned an empty body.` };
    }
    body = response.body;
  } catch (error) {
    return { ok: false, reason: 'network', message: `gh: ${ghMessage} https: ${extractMessage(error)}` };
  }
  // A local disk failure, not a transport one: it gets its own message so `network` keeps meaning the network.
  try {
    deps.writeFile(path, body);
  } catch (error) {
    return { ok: false, reason: 'asset-missing', message: `https: ${url} was downloaded but could not be written: ${extractMessage(error)}` };
  }
  return { ok: true, path, dir };
}

/** Remove `dir`, never letting a failed removal replace the answer it cleans up after. */
export function removeQuietly(removeDir: (dir: string) => void, dir: string): void {
  try {
    removeDir(dir);
  } catch {
    // A leftover temp dir is the OS's to reclaim; the fetch answer stands.
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
    const text = stderr?.toString().trim() ?? '';
    if (text !== '') {
      return text;
    }
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }
  return String(error);
}
