import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Every `ng update` migration is a real factory with a spec and a fixture
 * pair. The migration-gate job only checks that a breaking PR adds a key to
 * migrations.json; this guard makes sure that key leads somewhere.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCHEMATICS = join(ROOT, 'projects', 'core', 'schematics');
const MIGRATIONS = join(SCHEMATICS, 'migrations');
const FIXTURES = join(SCHEMATICS, 'testing', 'fixtures', 'migrations');

const collection = JSON.parse(readFileSync(join(MIGRATIONS, 'migrations.json'), 'utf8'));
const entries = Object.entries(collection.schematics);

// `migration-v<version>` for a release's first migration; a later breaking
// change in the same release adds `migration-v<version>-<slug>`, so every
// breaking PR brings its own key. The folder is the key without the prefix.
const KEY = /^migration-v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?)(-[a-z][a-z0-9-]*)?$/;

function folderOf(key) {
  return key.slice('migration-v'.length);
}

function nonEmpty(dir) {
  return existsSync(dir) && readdirSync(dir, { recursive: true }).length > 0;
}

describe('migrations.json', () => {
  it('declares at least one migration', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it.each(entries)('%s is well formed', (key, entry) => {
    const match = KEY.exec(key);

    expect(match, `${key} is not migration-v<version>[-<slug>]`).not.toBeNull();
    expect(entry.version).toBe(match?.[1]);
    expect(entry.description).toEqual(expect.any(String));
    expect(entry.factory).toBe(`./${folderOf(key)}/index#migrate`);
  });

  it.each(entries)('%s resolves to an exported factory with a spec', (key) => {
    const dir = join(MIGRATIONS, folderOf(key));
    const source = readFileSync(join(dir, 'index.ts'), 'utf8');

    expect(source).toMatch(/export function migrate\(/);
    expect(existsSync(join(dir, 'index.spec.ts'))).toBe(true);
  });

  it.each(entries)('%s has a before and after fixture', (key) => {
    expect(nonEmpty(join(FIXTURES, folderOf(key), 'before'))).toBe(true);
    expect(nonEmpty(join(FIXTURES, folderOf(key), 'after'))).toBe(true);
  });

  it('has an entry for every migration folder', () => {
    const folders = readdirSync(MIGRATIONS, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    expect(folders).toEqual(entries.map(([key]) => folderOf(key)).sort());
  });
});
