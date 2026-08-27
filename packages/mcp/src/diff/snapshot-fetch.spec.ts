import { describe, expect, it } from 'vitest';
import type { SnapshotFetchDeps } from './snapshot-fetch.js';
import { CNGX_REPO, classifyGhFailure, fetchSnapshot, ghDownloadArgs } from './snapshot-fetch.js';

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

  it('maps everything else to asset-missing', () => {
    const error = Object.assign(new Error('gh failed'), { stderr: 'release not found' });

    expect(classifyGhFailure(error).reason).toBe('asset-missing');
  });
});

describe('fetchSnapshot', () => {
  it('returns the documentation.json path inside the temp dir on success', () => {
    const deps: SnapshotFetchDeps = { download: () => undefined, makeTempDir: () => '/tmp/cngx-mcp-test' };

    expect(fetchSnapshot('0.2.0', deps)).toEqual({ ok: true, path: '/tmp/cngx-mcp-test/documentation.json' });
  });

  it('returns the classified failure instead of throwing when the download fails', () => {
    const deps: SnapshotFetchDeps = {
      download: () => {
        throw Object.assign(new Error('spawn gh ENOENT'), { code: 'ENOENT' });
      },
      makeTempDir: () => '/tmp/cngx-mcp-test',
    };

    expect(fetchSnapshot('0.2.0', deps)).toEqual({
      ok: false,
      reason: 'gh-missing',
      message: 'The `gh` CLI is not installed or not on PATH.',
    });
  });
});
