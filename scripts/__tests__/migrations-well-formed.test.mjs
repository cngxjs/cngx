import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { entryProblems, fixtureProblems, folderOf, keyProblems, specProblems } from '../migrations-well-formed.mjs';
import { SELF_TEST_ENTRIES, SELF_TEST_FILES, SELF_TEST_FIXTURES } from './migrations-well-formed.fixtures.mjs';

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

const SOURCE = {
  readFile: (path) => readOptional(join(MIGRATIONS, path)),
  readFixture: (path) => readFixture(join(FIXTURES, path)),
};

const SELF_TEST = {
  readFile: (path) => SELF_TEST_FILES[path],
  readFixture: (path) => SELF_TEST_FIXTURES[path],
};

// The hand-written map is empty until a release needs its own migration, so
// the same per-entry rules also run on a one-entry self-test collection.
describe.skipIf(entries.length === 0)('migrations.json entries', () => {
  it.each(entries)('%s has a well-formed key, factory, spec and fixture pair', (key, entry) => {
    expect(entryProblems(key, entry, SOURCE)).toEqual([]);
  });
});

describe('the self-test collection', () => {
  const [[key, entry]] = Object.entries(SELF_TEST_ENTRIES);
  const withFile = (path, content) => ({ ...SELF_TEST, readFile: (file) => (file === path ? content : SELF_TEST.readFile(file)) });

  it('passes every per-entry rule', () => {
    expect(entryProblems(key, entry, SELF_TEST)).toEqual([]);
  });

  it('fails on a missing factory, a missing spec and a missing fixture pair', () => {
    expect(entryProblems(key, entry, withFile('0.2.0/index.ts', undefined))).toContain('index.ts is missing');
    expect(entryProblems(key, entry, withFile('0.2.0/index.spec.ts', undefined))).toContain('index.spec.ts is missing');
    expect(entryProblems(key, entry, { ...SELF_TEST, readFixture: () => undefined })).not.toEqual([]);
  });

  it('fails on a spec that names migrate only in a comment or never reads its own pair', () => {
    const spec = SELF_TEST_FILES['0.2.0/index.spec.ts'];

    expect(entryProblems(key, entry, withFile('0.2.0/index.spec.ts', spec.replace('runRule(migrate(),', '/* migrate() */ runRule(other(),')))).toContain(
      'index.spec.ts has no case that calls migrate or createMigration',
    );
    expect(entryProblems(key, entry, withFile('0.2.0/index.spec.ts', spec.replace("readMigrationFixture('0.2.0')", "readMigrationFixture('refresh')")))).toContain(
      "index.spec.ts never reads its fixture pair through readMigrationFixture('0.2.0')",
    );
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
  const SPEC = "it('renames the trigger', async () => { await runRule(migrate(), tree); });";

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
    const pair = "const { before } = readMigrationFixture('0.2.0');";

    expect(specProblems('', '0.2.0')).not.toEqual([]);
    expect(specProblems(`${pair} it('is pending', () => {});`, '0.2.0')).not.toEqual([]);
    expect(specProblems(`${pair} it('passes it on', async () => { await runMigration(migrate, tree); });`, '0.2.0')).not.toEqual([]);
    expect(specProblems(`${pair} ${SPEC}`, '0.2.0')).toEqual([]);
    expect(specProblems(`${pair} it('re-runs', async () => { await runRule(createMigration({}), tree); });`, '0.2.0')).toEqual([]);
    expect(specProblems(SPEC, '0.2.0')).not.toEqual([]);
  });

  it('rejects placeholder fixtures and an after that equals before', () => {
    const before = { '.cngx/install.json': '{"a":1}' };

    expect(fixtureProblems({ '.gitkeep': '' }, { '.gitkeep': '' })).not.toEqual([]);
    expect(fixtureProblems(before, { ...before })).not.toEqual([]);
    expect(fixtureProblems(before, { '.cngx/install.json': '{"a":2}' })).toEqual([]);
  });
});
