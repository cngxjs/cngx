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

function nonEmpty(dir) {
  return existsSync(dir) && readdirSync(dir, { recursive: true }).length > 0;
}

describe('migrations.json', () => {
  it('declares at least one migration', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it.each(entries)('%s is well formed', (key, entry) => {
    expect(key).toBe(`migration-v${entry.version}`);
    expect(entry.version).toMatch(/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/);
    expect(entry.description).toEqual(expect.any(String));
    expect(entry.factory).toBe(`./${entry.version}/index#migrate`);
  });

  it.each(entries)('%s resolves to an exported factory with a spec', (_key, entry) => {
    const dir = join(MIGRATIONS, entry.version);
    const source = readFileSync(join(dir, 'index.ts'), 'utf8');

    expect(source).toMatch(/export function migrate\(/);
    expect(existsSync(join(dir, 'index.spec.ts'))).toBe(true);
  });

  it.each(entries)('%s has a before and after fixture', (_key, entry) => {
    expect(nonEmpty(join(FIXTURES, entry.version, 'before'))).toBe(true);
    expect(nonEmpty(join(FIXTURES, entry.version, 'after'))).toBe(true);
  });

  it('has an entry for every migration folder', () => {
    const folders = readdirSync(MIGRATIONS, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    expect(folders).toEqual(entries.map(([, entry]) => entry.version).sort());
  });
});
