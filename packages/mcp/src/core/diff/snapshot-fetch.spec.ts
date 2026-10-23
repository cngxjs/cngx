import { describe, expect, it, vi } from 'vitest';
import type { SnapshotFetchDeps } from './snapshot-fetch.js';
import {
  CNGX_REPO,
  classifyGhFailure,
  fetchSnapshot,
  ghDownloadArgs,
  isReleaseVersion,
  RELEASE_BASE_URL,
  releaseAssetUrl,
} from './snapshot-fetch.js';

describe('ghDownloadArgs', () => {
  it('pins the download to the cngx repo, independent of the working directory', () => {
    // Without --repo, gh resolves the repo from the cwd's git remote - and
    // `npx @cngx/mcp` runs inside the consumer's checkout, not the cngx one.
    expect(ghDownloadArgs('0.2.0', '/tmp/snap')).toEqual([
      'release',
      'download',
      'v0.2.0',
      '--repo',
      CNGX_REPO,
      '--pattern',
      'documentation.json',
      '--dir',
      '/tmp/snap',
    ]);
  });

  it('targets the tagged release v<version>', () => {
    expect(ghDownloadArgs('1.0.0', '/x')).toContain('v1.0.0');
  });
});

describe('classifyGhFailure', () => {
  it('maps ENOENT to gh-missing', () => {
    const error = Object.assign(new Error('spawn gh ENOENT'), { code: 'ENOENT' });

    expect(classifyGhFailure(error).reason).toBe('gh-missing');
  });

  it('maps a network-flavoured stderr to network', () => {
    const error = Object.assign(new Error('gh failed'), { stderr: 'dial tcp: lookup github.com: no such host' });

    expect(classifyGhFailure(error)).toEqual({
      reason: 'network',
      message: 'dial tcp: lookup github.com: no such host',
    });
  });

  it('maps a child killed by the timeout to network', () => {
    const killed = Object.assign(new Error('Command failed'), { killed: true, signal: 'SIGTERM' });
    const timedOut = Object.assign(new Error('spawn timed out'), { code: 'ETIMEDOUT' });

    expect(classifyGhFailure(killed).reason).toBe('network');
    expect(classifyGhFailure(timedOut).reason).toBe('network');
  });

  it('maps everything else to asset-missing', () => {
    const error = Object.assign(new Error('gh failed'), { stderr: 'release not found' });

    expect(classifyGhFailure(error).reason).toBe('asset-missing');
  });
});

describe('isReleaseVersion', () => {
  it('accepts release and prerelease versions, including hyphenated prerelease ids', () => {
    for (const version of ['0.2.0', '10.20.30', '0.1.0-rc.9', '0.2.0-rc-1', '1.0.0-alpha.beta-2']) {
      expect(isReleaseVersion(version), version).toBe(true);
    }
  });

  it('rejects anything that could escape a path or URL segment', () => {
    for (const version of ['../x', '1.0/../..', 'latest', '', 'v0.2.0', '0.2', '0.2.0/x', '0.2.0\\x', '0.2.0-a..b']) {
      expect(isReleaseVersion(version), version).toBe(false);
    }
  });
});

describe('releaseAssetUrl', () => {
  it('points at the documentation.json asset of the tagged cngx release', () => {
    expect(releaseAssetUrl(RELEASE_BASE_URL, '0.1.0-rc.9')).toBe(
      'https://github.com/cngxjs/cngx/releases/download/v0.1.0-rc.9/documentation.json',
    );
  });
});

const DIR = '/tmp/cngx-mcp-test';
const BASE = 'https://example.test/releases/download';

function makeDeps(overrides: Partial<SnapshotFetchDeps> = {}): SnapshotFetchDeps {
  return {
    runGh: vi.fn(async () => undefined),
    httpGet: vi.fn(async () => ({ status: 200, body: '{"https":true}' })),
    releaseBaseUrl: BASE,
    writeFile: vi.fn(),
    makeTempDir: vi.fn(() => DIR),
    ...overrides,
  };
}

const ghThrows = (error: Error) =>
  vi.fn(async () => {
    throw error;
  });

describe('fetchSnapshot', () => {
  it('returns the gh download and never calls HTTPS when gh succeeds', async () => {
    const deps = makeDeps();

    expect(await fetchSnapshot('0.2.0', deps)).toEqual({ ok: true, path: `${DIR}/documentation.json` });
    expect(deps.runGh).toHaveBeenCalledWith(ghDownloadArgs('0.2.0', DIR));
    expect(deps.httpGet).not.toHaveBeenCalled();
  });

  it('falls back to HTTPS when gh is not installed', async () => {
    const deps = makeDeps({ runGh: ghThrows(Object.assign(new Error('spawn gh ENOENT'), { code: 'ENOENT' })) });

    expect(await fetchSnapshot('0.2.0', deps)).toEqual({ ok: true, path: `${DIR}/documentation.json` });
    expect(deps.httpGet).toHaveBeenCalledWith(`${BASE}/v0.2.0/documentation.json`);
    expect(deps.writeFile).toHaveBeenCalledWith(`${DIR}/documentation.json`, '{"https":true}');
  });

  it('falls back to HTTPS when gh is not authenticated', async () => {
    const unauthenticated = Object.assign(new Error('Command failed'), {
      stderr: 'To get started with GitHub CLI, please run:  gh auth login',
    });
    const deps = makeDeps({ runGh: ghThrows(unauthenticated) });

    expect(await fetchSnapshot('0.2.0', deps)).toEqual({ ok: true, path: `${DIR}/documentation.json` });
    expect(deps.httpGet).toHaveBeenCalledTimes(1);
  });

  it('maps a 404 after a gh failure to asset-missing', async () => {
    const deps = makeDeps({
      runGh: ghThrows(new Error('release not found')),
      httpGet: vi.fn(async () => ({ status: 404, body: '' })),
    });

    expect(await fetchSnapshot('9.9.9', deps)).toMatchObject({ ok: false, reason: 'asset-missing' });
    expect(deps.writeFile).not.toHaveBeenCalled();
  });

  it('maps a transport error after a gh failure to network', async () => {
    const deps = makeDeps({
      runGh: ghThrows(Object.assign(new Error('spawn gh ENOENT'), { code: 'ENOENT' })),
      httpGet: vi.fn(async () => {
        throw new TypeError('fetch failed');
      }),
    });

    expect(await fetchSnapshot('0.2.0', deps)).toMatchObject({ ok: false, reason: 'network' });
  });

  it('maps a non-404 HTTP failure to network', async () => {
    const deps = makeDeps({
      runGh: ghThrows(new Error('release not found')),
      httpGet: vi.fn(async () => ({ status: 503, body: '' })),
    });

    expect(await fetchSnapshot('0.2.0', deps)).toMatchObject({ ok: false, reason: 'network' });
  });

  it('never produces gh-missing: a missing gh always reaches the HTTPS path', async () => {
    const deps = makeDeps({
      runGh: ghThrows(Object.assign(new Error('spawn gh ENOENT'), { code: 'ENOENT' })),
      httpGet: vi.fn(async () => ({ status: 404, body: '' })),
    });

    expect(await fetchSnapshot('0.2.0', deps)).toMatchObject({ ok: false, reason: 'asset-missing' });
  });

  it('rejects an invalid version before any dep is called', async () => {
    const deps = makeDeps();

    expect(await fetchSnapshot('../x', deps)).toMatchObject({
      ok: false,
      reason: 'asset-missing',
      message: expect.stringContaining('not a release version'),
    });
    expect(deps.makeTempDir).not.toHaveBeenCalled();
    expect(deps.runGh).not.toHaveBeenCalled();
    expect(deps.httpGet).not.toHaveBeenCalled();
  });

  it('accepts a hyphenated prerelease and fetches its tag', async () => {
    const deps = makeDeps({ runGh: ghThrows(new Error('release not found')) });

    expect(await fetchSnapshot('0.2.0-rc-1', deps)).toEqual({ ok: true, path: `${DIR}/documentation.json` });
    expect(deps.httpGet).toHaveBeenCalledWith(`${BASE}/v0.2.0-rc-1/documentation.json`);
  });
});
