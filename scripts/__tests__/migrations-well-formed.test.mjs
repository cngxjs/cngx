import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { factoryProblems, fixtureProblems, folderOf, keyProblems, specProblems } from '../migrations-well-formed.mjs';

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

const REFRESH = 'refresh';

function readOptional(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : undefined;
}

// Every file under a fixture folder, keyed by its path inside it.
function readFixture(dir) {
  if (!existsSync(dir)) {
    return undefined;
  }
  const files = {};
  for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (entry.isFile()) {
      const path = join(entry.parentPath, entry.name);
      files[relative(dir, path)] = readFileSync(path, 'utf8');
    }
  }
  return files;
}

describe('migrations.json', () => {
  it('declares at least one migration', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it.each(entries)('%s is well formed', (key, entry) => {
    expect(keyProblems(key, entry)).toEqual([]);
  });

  it.each(entries)('%s resolves to an exported factory with a spec', (key) => {
    const dir = join(MIGRATIONS, folderOf(key));

    expect(factoryProblems(readOptional(join(dir, 'index.ts')))).toEqual([]);
    expect(specProblems(readOptional(join(dir, 'index.spec.ts')))).toEqual([]);
  });

  it.each(entries)('%s has a before and after fixture', (key) => {
    const dir = join(FIXTURES, folderOf(key));

    expect(fixtureProblems(readFixture(join(dir, 'before')), readFixture(join(dir, 'after')))).toEqual([]);
  });

  // `refresh/` has no key here: publish.mjs keys it to every release that
  // ships no migration of its own, in the published collection only.
  it('has an entry for every migration folder but the refresh factory', () => {
    const folders = readdirSync(MIGRATIONS, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    expect(folders).toEqual([...entries.map(([key]) => folderOf(key)), REFRESH].sort());
  });

  it('keeps the refresh factory out of the hand-written keys', () => {
    expect(entries.map(([, entry]) => entry.factory)).not.toContain(`./${REFRESH}/index#migrate`);
  });
});
