import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  loadBundledDocs,
  SchemaVersionError,
  SUPPORTED_SCHEMA_VERSIONS,
} from '../../packages/mcp/src/core/data/loader.ts';
import { checkBundledSnapshot } from '../mcp-bundle-check.mjs';

const FIXTURES = resolve(dirname(fileURLToPath(import.meta.url)), '../../packages/mcp/test/fixtures');
const readFixture = (name) => JSON.parse(readFileSync(join(FIXTURES, name), 'utf8'));

// The schema-2 sample predates `miscellaneous`; the gate requires at least one function.
const schemaTwo = () => ({
  ...readFixture('documentation.sample.json'),
  miscellaneous: { functions: [{ name: 'provideSelectConfig', file: 'projects/forms/select/shared/config.ts' }] },
});
const schemaSix = () => readFixture('documentation.v6.sample.json');

function check(doc, expectedVersion) {
  const dataDir = mkdtempSync(join(tmpdir(), 'cngx-mcp-bundle-'));
  if (doc) {
    writeFileSync(join(dataDir, 'documentation.json'), JSON.stringify(doc));
  }
  return checkBundledSnapshot({ dataDir, expectedVersion, loadBundledDocs });
}

describe('checkBundledSnapshot', () => {
  it('accepts a schema-2 bundle stamped with the expected version', () => {
    const result = check(schemaTwo(), '0.1.0-rc.6');

    expect(result).toMatchObject({ ok: true, meta: { schemaVersion: 2, cngxVersion: '0.1.0-rc.6' } });
    expect(result.counts.components).toBeGreaterThan(0);
    expect(result.counts.functions).toBe(1);
  });

  it('accepts a schema-6 bundle stamped with the expected version', () => {
    const result = check(schemaSix(), '0.1.0-rc.9');

    expect(result).toMatchObject({ ok: true, meta: { schemaVersion: 6, cngxVersion: '0.1.0-rc.9' } });
    expect(result.counts.functions).toBeGreaterThan(0);
  });

  // Derived from the loader so adding a supported version never breaks this case.
  it('rejects an unsupported schemaVersion with the loader message', () => {
    const unsupported = Math.max(...SUPPORTED_SCHEMA_VERSIONS) + 1;

    const result = check({ ...schemaSix(), schemaVersion: unsupported }, '0.1.0-rc.9');

    expect(result).toEqual({ ok: false, message: new SchemaVersionError(unsupported).message });
  });

  it('rejects a stale bundle stamped with another version, naming both', () => {
    const result = check(schemaSix(), '0.1.0-rc.10');

    expect(result.ok).toBe(false);
    expect(result.message).toContain('0.1.0-rc.9');
    expect(result.message).toContain('0.1.0-rc.10');
  });

  it('rejects a bundle that loads but has no components', () => {
    const result = check({ ...schemaSix(), components: [], directives: [], injectables: [] }, '0.1.0-rc.9');

    expect(result.ok).toBe(false);
    expect(result.message).toContain('0 components');
  });

  it('rejects a missing bundle without throwing', () => {
    const result = check(null, '0.1.0-rc.9');

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/ENOENT/);
  });
});
