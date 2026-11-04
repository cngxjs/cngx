import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  loadBundledDocs,
  SchemaVersionError,
  SUPPORTED_SCHEMA_VERSIONS,
} from '../../packages/mcp/src/core/data/loader.ts';
import { checkBundledSnapshot, expectedVersionFor, parseBundleCheckArgs } from '../mcp-bundle-check.mjs';

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

describe('parseBundleCheckArgs', () => {
  const root = resolve(tmpdir(), 'cngx-repo');

  it('defaults to the mcp bundle when no argument is given', () => {
    expect(parseBundleCheckArgs([], root)).toEqual({
      ok: true,
      dataDir: join(root, 'packages', 'mcp', 'data'),
      label: 'packages/mcp/data',
      expect: 'root',
    });
  });

  it('resolves a relative --data-dir against the repo root, not the cwd', () => {
    expect(parseBundleCheckArgs(['--data-dir=packages/cli/data'], root)).toEqual({
      ok: true,
      dataDir: join(root, 'packages', 'cli', 'data'),
      label: 'packages/cli/data',
      expect: 'root',
    });
  });

  it('reads --expect=package next to --data-dir', () => {
    expect(parseBundleCheckArgs(['--data-dir=packages/cli/data', '--expect=package'], root)).toMatchObject({
      ok: true,
      dataDir: join(root, 'packages', 'cli', 'data'),
      expect: 'package',
    });
    expect(parseBundleCheckArgs(['--expect=root'], root)).toMatchObject({ ok: true, expect: 'root' });
  });

  it('rejects an unknown --expect value, naming it', () => {
    const result = parseBundleCheckArgs(['--expect=registry'], root);

    expect(result.ok).toBe(false);
    expect(result.message).toContain('registry');
  });

  it('keeps an absolute --data-dir', () => {
    const elsewhere = resolve(tmpdir(), 'elsewhere', 'data');

    expect(parseBundleCheckArgs([`--data-dir=${elsewhere}`], root)).toMatchObject({ ok: true, dataDir: elsewhere });
  });

  it('rejects an empty --data-dir', () => {
    expect(parseBundleCheckArgs(['--data-dir='], root)).toMatchObject({ ok: false });
  });

  it('rejects an unknown argument, naming it', () => {
    const result = parseBundleCheckArgs(['--data=packages/cli/data'], root);

    expect(result.ok).toBe(false);
    expect(result.message).toContain('--data=packages/cli/data');
  });
});

describe('package mode', () => {
  // A repo root at one version holding a package at another, like a release
  // run that stamped the tooling manifest but has not bumped the root yet.
  function releaseTree(packageVersion) {
    const root = mkdtempSync(join(tmpdir(), 'cngx-mcp-release-'));
    const dataDir = join(root, 'packages', 'mcp', 'data');
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(join(root, 'package.json'), JSON.stringify({ version: '0.1.0-rc.9' }));
    writeFileSync(join(root, 'packages', 'mcp', 'package.json'), JSON.stringify({ version: packageVersion }));
    writeFileSync(join(dataDir, 'documentation.json'), JSON.stringify({ ...schemaSix(), cngxVersion: '0.3.0' }));
    return { root, dataDir };
  }

  it('expects the version of the package that owns the data dir', () => {
    const { root, dataDir } = releaseTree('0.3.0');

    expect(expectedVersionFor({ expect: 'package', root, dataDir })).toBe('0.3.0');
    expect(expectedVersionFor({ expect: 'root', root, dataDir })).toBe('0.1.0-rc.9');
  });

  it('accepts a bundle stamped with the package version while the root is behind', () => {
    const { root, dataDir } = releaseTree('0.3.0');
    const expectedVersion = expectedVersionFor({ expect: 'package', root, dataDir });

    expect(checkBundledSnapshot({ dataDir, expectedVersion, loadBundledDocs })).toMatchObject({ ok: true });
  });

  it('rejects a bundle stamped with another version than the package, naming both', () => {
    const { root, dataDir } = releaseTree('0.3.1');
    const expectedVersion = expectedVersionFor({ expect: 'package', root, dataDir });

    const result = checkBundledSnapshot({ dataDir, expectedVersion, loadBundledDocs });

    expect(result.ok).toBe(false);
    expect(result.message).toContain('0.3.0');
    expect(result.message).toContain('0.3.1');
  });
});
