import { describe, expect, it, vi } from 'vitest';
import type { SnapshotFetchDeps } from './snapshot-fetch.js';
import {
  CNGX_REPO,
  fetchSnapshot,
  ghDownloadArgs,
  isReleaseVersion,
  normalizeReleaseVersion,
  RELEASE_BASE_URL,
  releaseAssetUrl,
} from './snapshot-fetch.js';

describe('normalizeReleaseVersion', () => {
  it.each([
    ['0.1.0', '0.1.0'],
    [' 0.1.0-rc.9 ', '0.1.0-rc.9'],
    ['v0.1.0-rc.9', '0.1.0-rc.9'],
    ['V1.0.0', '1.0.0'],
  ])('accepts %j as %s', (input, version) => {
    expect(normalizeReleaseVersion(input)).toEqual({ ok: true, version });
  });

  it.each(['', ' ', 'v', ' V '])('rejects %j as a blank version and echoes the input', (input) => {
    expect(normalizeReleaseVersion(input)).toEqual({ ok: false, message: `"${input}" is not a release version; the version is blank.` });
  });

  it.each(['vv0.2.0', 'latest', '../x', '01.2.3', '1.02.3', '1.2.03', '1.2.3-.', '1.2.3-rc.', '1.2.3-rc..1', '1.2.3-.rc', '1.2.3-rc.01', '1.2.3-01'])(
    'rejects %j and echoes the input',
    (input) => {
      const result = normalizeReleaseVersion(input);

      expect(!result.ok && result.message).toMatch(new RegExp(`^"${input.replace(/[.]/g, '\\.')}" is not a release version`));
    },
  );

  it.each(['0.0.0', '10.20.30', '1.2.3-rc.1', '1.2.3-0', '1.2.3-rc.0', '1.2.3-alpha-1', '1.2.3-0a', '1.2.3-x-y.z', '1.2.3-alpha-.1'])('accepts the release version %j', (input) => {
    expect(normalizeReleaseVersion(input)).toEqual({ ok: true, version: input });
  });
});

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
    removeDir: vi.fn(),
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

    expect(await fetchSnapshot('0.2.0', deps)).toEqual({ ok: true, path: `${DIR}/documentation.json`, dir: DIR });
    expect(deps.runGh).toHaveBeenCalledWith(ghDownloadArgs('0.2.0', DIR));
    expect(deps.httpGet).not.toHaveBeenCalled();
  });

  it('returns a typed failure when no temp directory can be created', async () => {
    const deps = makeDeps({
      makeTempDir: vi.fn(() => {
        throw new Error('EACCES: permission denied');
      }),
    });

    expect(await fetchSnapshot('0.2.0', deps)).toEqual({
      ok: false,
      reason: 'asset-missing',
      message: 'No temp directory for the snapshot: EACCES: permission denied',
    });
    expect(deps.runGh).not.toHaveBeenCalled();
  });

  it('falls back to HTTPS when gh is not installed', async () => {
    const deps = makeDeps({ runGh: ghThrows(Object.assign(new Error('spawn gh ENOENT'), { code: 'ENOENT' })) });

    expect(await fetchSnapshot('0.2.0', deps)).toEqual({ ok: true, path: `${DIR}/documentation.json`, dir: DIR });
    expect(deps.httpGet).toHaveBeenCalledWith(`${BASE}/v0.2.0/documentation.json`);
    expect(deps.writeFile).toHaveBeenCalledWith(`${DIR}/documentation.json`, '{"https":true}');
  });

  it('falls back to HTTPS when gh is not authenticated', async () => {
    const unauthenticated = Object.assign(new Error('Command failed'), {
      stderr: 'To get started with GitHub CLI, please run:  gh auth login',
    });
    const deps = makeDeps({ runGh: ghThrows(unauthenticated) });

    expect(await fetchSnapshot('0.2.0', deps)).toEqual({ ok: true, path: `${DIR}/documentation.json`, dir: DIR });
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
      reason: 'invalid-version',
      message: expect.stringContaining('not a release version'),
    });
    expect(deps.makeTempDir).not.toHaveBeenCalled();
    expect(deps.runGh).not.toHaveBeenCalled();
    expect(deps.httpGet).not.toHaveBeenCalled();
  });

  it('accepts a hyphenated prerelease and fetches its tag', async () => {
    const deps = makeDeps({ runGh: ghThrows(new Error('release not found')) });

    expect(await fetchSnapshot('0.2.0-rc-1', deps)).toEqual({ ok: true, path: `${DIR}/documentation.json`, dir: DIR });
    expect(deps.httpGet).toHaveBeenCalledWith(`${BASE}/v0.2.0-rc-1/documentation.json`);
  });
});

describe('fetchSnapshot temp dir', () => {
  it('hands the dir to the caller on success instead of removing it', async () => {
    const deps = makeDeps();

    expect(await fetchSnapshot('0.2.0', deps)).toMatchObject({ ok: true, dir: DIR });
    expect(deps.removeDir).not.toHaveBeenCalled();
  });

  it('removes the dir after a 404', async () => {
    const deps = makeDeps({
      runGh: ghThrows(new Error('release not found')),
      httpGet: vi.fn(async () => ({ status: 404, body: '' })),
    });

    expect(await fetchSnapshot('9.9.9', deps)).toMatchObject({ ok: false });
    expect(deps.removeDir).toHaveBeenCalledWith(DIR);
  });

  it('removes the dir after a non-404 HTTP failure', async () => {
    const deps = makeDeps({
      runGh: ghThrows(new Error('release not found')),
      httpGet: vi.fn(async () => ({ status: 503, body: '' })),
    });

    expect(await fetchSnapshot('0.2.0', deps)).toMatchObject({ ok: false });
    expect(deps.removeDir).toHaveBeenCalledWith(DIR);
  });

  it('removes the dir after a transport error', async () => {
    const deps = makeDeps({
      runGh: ghThrows(new Error('release not found')),
      httpGet: vi.fn(async () => {
        throw new TypeError('fetch failed');
      }),
    });

    expect(await fetchSnapshot('0.2.0', deps)).toMatchObject({ ok: false });
    expect(deps.removeDir).toHaveBeenCalledWith(DIR);
  });

  it('removes the dir after a write failure', async () => {
    const deps = makeDeps({
      runGh: ghThrows(new Error('release not found')),
      writeFile: vi.fn(() => {
        throw new Error('ENOSPC: no space left on device');
      }),
    });

    expect(await fetchSnapshot('0.2.0', deps)).toMatchObject({ ok: false });
    expect(deps.removeDir).toHaveBeenCalledWith(DIR);
  });

  it('keeps the typed failure when the removal itself throws', async () => {
    const deps = makeDeps({
      runGh: ghThrows(new Error('release not found')),
      httpGet: vi.fn(async () => ({ status: 404, body: '' })),
      removeDir: vi.fn(() => {
        throw new Error('EBUSY');
      }),
    });

    expect(await fetchSnapshot('9.9.9', deps)).toMatchObject({ ok: false, reason: 'asset-missing' });
  });
});

describe('fetchSnapshot failure messages', () => {
  it('reports a write failure after a 200 as a write failure, not as network', async () => {
    const deps = makeDeps({
      runGh: ghThrows(new Error('release not found')),
      writeFile: vi.fn(() => {
        throw new Error('ENOSPC: no space left on device');
      }),
    });

    const result = await fetchSnapshot('0.2.0', deps);

    expect(result).toMatchObject({ ok: false, reason: 'asset-missing' });
    expect((result as { message: string }).message).toContain('could not be written');
    expect((result as { message: string }).message).toContain('ENOSPC');
  });

  it('reports a 200 without a body as an empty asset', async () => {
    const deps = makeDeps({
      runGh: ghThrows(new Error('release not found')),
      httpGet: vi.fn(async () => ({ status: 200, body: null as unknown as string })),
    });

    const result = await fetchSnapshot('0.2.0', deps);

    expect(result).toMatchObject({ ok: false, reason: 'asset-missing' });
    expect((result as { message: string }).message).toContain('empty body');
    expect((result as { message: string }).message).not.toContain('Cannot read properties');
    expect(deps.writeFile).not.toHaveBeenCalled();
  });

  it('falls back to the error message when gh stderr is empty', async () => {
    const error = Object.assign(new Error('Command failed: gh release download'), { stderr: '  ' });
    const deps = makeDeps({ runGh: ghThrows(error), httpGet: vi.fn(async () => ({ status: 404, body: '' })) });

    const result = await fetchSnapshot('0.2.0', deps);

    expect(!result.ok && result.message).toMatch(/^gh: Command failed: gh release download https: /);
  });
});

describe('fetchSnapshot failure messages', () => {
  const stub = {
    makeTempDir: () => '/tmp/cngx-mcp-snapshot-msg',
    removeDir: () => undefined,
    releaseBaseUrl: 'https://example.test/releases/download',
    writeFile: () => undefined,
  };
  const ghMissing = async () => {
    throw Object.assign(new Error('spawn gh ENOENT'), { code: 'ENOENT' });
  };

  it('names an invalid version precisely under invalid-version', async () => {
    const result = await fetchSnapshot('latest', { ...stub, httpGet: async () => ({ status: 404, body: '' }), runGh: ghMissing });

    expect(result).toMatchObject({ ok: false, reason: 'invalid-version' });
    expect(!result.ok && result.message).toMatch(/^"latest" is not a release version/);
  });

  it.each(['latest', '1.2.3-rc.01'])('echoes %j with the same message normalizeReleaseVersion gives', async (input) => {
    const result = await fetchSnapshot(input, { ...stub, runGh: ghMissing });
    const normalized = normalizeReleaseVersion(input);

    expect(result).toMatchObject({ ok: false, reason: 'invalid-version' });
    expect(!result.ok && result.message).toBe(!normalized.ok && normalized.message);
  });

  it('keeps the missing-gh explanation in the message of a network failure, never the gh-missing reason', async () => {
    const result = await fetchSnapshot('9.9.9', {
      ...stub,
      httpGet: async () => {
        throw new TypeError('fetch failed');
      },
      runGh: ghMissing,
    });

    expect(result).toMatchObject({ ok: false, reason: 'network' });
    expect(!result.ok && result.message).toBe('gh: The `gh` CLI is not installed or not on PATH. https: fetch failed');
  });
});
