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
    expect(delta.components.signatureChanged).toEqual([]);
  });

  it('reports a removed injectable service as removed, never rename-inferred', () => {
    // CngxLegacyAnnouncer exists only in v0.1.0; injectables carry no rename key,
    // so the removal is reported plainly instead of being paired with an addition.
    expect(delta.components.removed).toEqual([{ name: 'CngxLegacyAnnouncer' }]);
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

describe('diffSnapshots rename inference is fingerprint-gated', () => {
  const index = (cngxVersion, components, tokens = []) => ({
    meta: { schemaVersion: 2, cngxVersion, generatedAt: null, compodocxVersion: null },
    components,
    directives: [],
    injectables: [],
    tokens,
  });

  it('reports a removed input as removed even when a same-typed input is added', () => {
    const from = index('1.0.0', [
      { name: 'CngxX', inputsClass: [{ name: 'disabled', type: 'boolean' }, { name: 'value', type: 'string' }] },
    ]);
    const to = index('2.0.0', [
      { name: 'CngxX', inputsClass: [{ name: 'checked', type: 'boolean' }, { name: 'value', type: 'string' }] },
    ]);
    const delta = diffSnapshots(from, to);

    expect(delta.inputs.removed).toEqual([{ name: 'disabled', owner: 'CngxX' }]);
    expect(delta.inputs.renamed).toEqual([]);
  });

  it('reports a removed DI token as removed, never a bare-type rename', () => {
    const from = index('1.0.0', [], [{ name: 'CNGX_OLD', type: 'InjectionToken<Cfg>' }]);
    const to = index('2.0.0', [], [{ name: 'CNGX_NEW', type: 'InjectionToken<Cfg>' }]);
    const delta = diffSnapshots(from, to);

    expect(delta.diTokens.removed).toEqual([{ name: 'CNGX_OLD' }]);
    expect(delta.diTokens.renamed).toEqual([]);
  });

  it('still infers a top-level rename from the entry-shape fingerprint', () => {
    const from = index('1.0.0', [{ name: 'CngxOld', category: 'ui', inputsClass: [{ name: 'open', type: 'boolean' }] }]);
    const to = index('2.0.0', [{ name: 'CngxNew', category: 'ui', inputsClass: [{ name: 'open', type: 'boolean' }] }]);
    const delta = diffSnapshots(from, to);

    expect(delta.components.renamed).toEqual([{ from: 'CngxOld', to: 'CngxNew' }]);
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
