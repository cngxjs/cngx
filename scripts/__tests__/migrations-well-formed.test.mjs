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

// The hand-written map is empty until a release needs its own migration;
// the rules themselves run against synthetic inputs below.
describe.skipIf(entries.length === 0)('migrations.json entries', () => {
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
});

describe('migrations.json', () => {
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

describe('well-formed rules', () => {
  const entry = (version, folder) => ({ version, description: 'x', factory: `./${folder}/index#migrate` });
  const SPEC = "it('renames the trigger', async () => { await runMigration(migrate, tree); });";

  it('accepts a release key and a slug key derived from the entry version', () => {
    expect(keyProblems('migration-v0.2.0', entry('0.2.0', '0.2.0'))).toEqual([]);
    expect(keyProblems('migration-v0.2.0-select', entry('0.2.0', '0.2.0-select'))).toEqual([]);
    expect(keyProblems('migration-v1.0.0-rc.1-select', entry('1.0.0-rc.1', '1.0.0-rc.1-select'))).toEqual([]);
  });

  it('rejects a key that does not start with its entry version', () => {
    expect(keyProblems('migration-v0.2.0-select', entry('0.3.0', '0.2.0-select'))).not.toEqual([]);
    expect(keyProblems('migration-v0.2.0-Select', entry('0.2.0', '0.2.0-Select'))).not.toEqual([]);
    expect(keyProblems('migration-0.2.0', entry('0.2.0', '0.2.0'))).not.toEqual([]);
  });

  it('rejects an empty spec and a spec without a case that runs the migration', () => {
    expect(specProblems('')).not.toEqual([]);
    expect(specProblems("it('is pending', () => {});")).not.toEqual([]);
    expect(specProblems(SPEC)).toEqual([]);
    expect(specProblems("it('re-runs', async () => { await runRule(createMigration({}), tree); });")).toEqual([]);
  });

  it('rejects placeholder fixtures and an after that equals before', () => {
    const before = { '.cngx/install.json': '{"a":1}' };

    expect(fixtureProblems({ '.gitkeep': '' }, { '.gitkeep': '' })).not.toEqual([]);
    expect(fixtureProblems(before, { ...before })).not.toEqual([]);
    expect(fixtureProblems(before, { '.cngx/install.json': '{"a":2}' })).toEqual([]);
  });
});
