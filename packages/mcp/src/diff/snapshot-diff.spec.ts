import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadDocsFromFile } from '../data/loader.js';
import { diffSnapshots } from './snapshot-diff.js';
import { classifyGhFailure, fetchSnapshot } from './snapshot-fetch.js';

const OLD = fileURLToPath(new URL('../../test/fixtures/documentation.v-old.sample.json', import.meta.url));
const NEW = fileURLToPath(new URL('../../test/fixtures/documentation.v-new.sample.json', import.meta.url));

describe('diffSnapshots', () => {
  const delta = diffSnapshots(loadDocsFromFile(OLD), loadDocsFromFile(NEW));

  it('records the resolved snapshot versions in meta', () => {
    expect(delta.meta).toMatchObject({ resolvedFrom: '0.1.0', resolvedTo: '0.2.0', from: '0.1.0', to: '0.2.0' });
  });

  it('reports a removed input under its owning component', () => {
    expect(delta.inputs.removed).toEqual([{ name: 'legacyMode', owner: 'CngxSelect' }]);
    expect(delta.inputs.renamed).toEqual([]);
    expect(delta.inputs.signatureChanged).toEqual([]);
  });

  it('infers a component rename from a stable category and shape', () => {
    expect(delta.components.renamed).toEqual([{ from: 'CngxOldPanel', to: 'CngxNewPanel' }]);
    expect(delta.components.removed).toEqual([]);
    expect(delta.components.signatureChanged).toEqual([]);
  });

  it('reports a changed slot as a signature change, not a removal', () => {
    expect(delta.slots.signatureChanged).toEqual([
      {
        name: 'cngxSelectCaret',
        owner: 'CngxSelect',
        fromSignature: 'The caret glyph.',
        toSignature: 'The caret glyph; now also fires on hover.',
      },
    ]);
    expect(delta.slots.removed).toEqual([]);
  });

  it('reports no delta for the unchanged DI token', () => {
    expect(delta.diTokens).toEqual({ removed: [], renamed: [], signatureChanged: [] });
  });
});

describe('fetchSnapshot failure classification', () => {
  const stubDir = { makeTempDir: () => '/tmp/cngx-mcp-snapshot-test' };

  it('returns gh-missing when the gh CLI is absent', () => {
    const result = fetchSnapshot('9.9.9', {
      ...stubDir,
      download: () => {
        const error = new Error('spawn gh ENOENT') as NodeJS.ErrnoException;
        error.code = 'ENOENT';
        throw error;
      },
    });
    expect(result).toEqual({ ok: false, reason: 'gh-missing', message: expect.any(String) });
  });

  it('classifies a missing release asset', () => {
    const result = fetchSnapshot('9.9.9', {
      ...stubDir,
      download: () => {
        throw new Error('release not found');
      },
    });
    expect(result).toMatchObject({ ok: false, reason: 'asset-missing' });
  });

  it('classifies a network failure', () => {
    const result = fetchSnapshot('9.9.9', {
      ...stubDir,
      download: () => {
        throw new Error('dial tcp: lookup api.github.com: no such host');
      },
    });
    expect(result).toMatchObject({ ok: false, reason: 'network' });
  });

  it('returns the downloaded path on success', () => {
    const result = fetchSnapshot('0.2.0', { makeTempDir: () => '/tmp/cngx-mcp-ok', download: () => undefined });
    expect(result).toEqual({ ok: true, path: '/tmp/cngx-mcp-ok/documentation.json' });
  });

  it('treats an unknown gh failure as asset-missing', () => {
    expect(classifyGhFailure(new Error('something odd happened')).reason).toBe('asset-missing');
  });
});
