import { describe, expect, it } from 'vitest';

import {
  checkMigrationGate,
  isBreakingTitle,
  MIGRATIONS_PATH,
  newMigrationKeys,
  readBase,
  saysNotMigratable,
} from '../migration-gate.mjs';

const BASE = JSON.stringify({
  schematics: {
    'migration-v0.1.0': { version: '0.1.0', factory: './0.1.0/index#migrate', description: 'd' },
  },
});

function withKeys(...keys) {
  return JSON.stringify({
    schematics: Object.fromEntries(
      keys.map((key) => [
        key,
        {
          version: key.slice('migration-v'.length),
          factory: './x/index#migrate',
          description: 'd',
        },
      ]),
    ),
  });
}

describe('newMigrationKeys', () => {
  it('lists the keys the head adds', () => {
    expect(newMigrationKeys(BASE, withKeys('migration-v0.1.0', 'migration-v0.2.0'))).toEqual([
      'migration-v0.2.0',
    ]);
  });

  it('lists nothing for an unchanged file', () => {
    expect(newMigrationKeys(BASE, BASE)).toEqual([]);
  });

  it('lists nothing when the head only rewords an entry', () => {
    const head = JSON.stringify({
      schematics: {
        'migration-v0.1.0': {
          version: '0.1.0',
          factory: './0.1.0/index#migrate',
          description: 'new',
        },
      },
    });

    expect(newMigrationKeys(BASE, head)).toEqual([]);
  });

  it('lists nothing when the head removes a key', () => {
    expect(newMigrationKeys(BASE, withKeys())).toEqual([]);
  });

  it('counts every head key as new when the base has no file', () => {
    expect(newMigrationKeys(undefined, BASE)).toEqual(['migration-v0.1.0']);
  });

  it('counts nothing when the head has no file', () => {
    expect(newMigrationKeys(BASE, undefined)).toEqual([]);
  });
});

describe('isBreakingTitle', () => {
  it('reads the bang of a Conventional Commit title', () => {
    expect(isBreakingTitle('feat(core)!: drop the old token')).toBe(true);
    expect(isBreakingTitle('refactor!: rename the card')).toBe(true);
    expect(isBreakingTitle('feat(core): add a token')).toBe(false);
    expect(isBreakingTitle('fix(ui): handle a ! in the subject')).toBe(false);
  });
});

describe('saysNotMigratable', () => {
  it('reads the literal line outside HTML comments', () => {
    expect(saysNotMigratable('Text\n\nMigration: not migratable\n')).toBe(true);
    expect(saysNotMigratable('Text\r\nMigration: not migratable\r\n')).toBe(true);
    expect(saysNotMigratable('<!-- Migration: not migratable -->\nMigration:')).toBe(false);
  });

  it('reads only the exact line', () => {
    expect(saysNotMigratable('Migration: Not Migratable')).toBe(false);
    expect(saysNotMigratable('  Migration: not migratable')).toBe(false);
    expect(saysNotMigratable('Migration:\nnot migratable')).toBe(false);
    expect(saysNotMigratable('Migration: none')).toBe(false);
    expect(saysNotMigratable(undefined)).toBe(false);
  });
});

describe('readBase', () => {
  function fakeGit(answers) {
    const calls = [];
    const exec = (args) => {
      calls.push(args.join(' '));
      const answer = answers[args[0]];
      if (answer instanceof Error) {
        throw answer;
      }
      return answer ?? '';
    };
    return { exec, calls };
  }

  it('reads the file the base branch has', () => {
    const { exec, calls } = fakeGit({ 'ls-tree': `${MIGRATIONS_PATH}\n`, show: BASE });

    expect(readBase('main', exec)).toBe(BASE);
    expect(calls).toEqual([
      'rev-parse --verify --quiet origin/main^{commit}',
      `ls-tree --name-only origin/main -- ${MIGRATIONS_PATH}`,
      `show origin/main:${MIGRATIONS_PATH}`,
    ]);
  });

  it('reads no file only when git lists none on the base branch', () => {
    const { exec } = fakeGit({ 'ls-tree': '' });

    expect(readBase('main', exec)).toBeUndefined();
  });

  it('fails closed when the base ref is missing', () => {
    const { exec } = fakeGit({ 'rev-parse': new Error('unknown revision') });

    expect(() => readBase('main', exec)).toThrow('unknown revision');
  });

  it('fails closed when git cannot show the listed file', () => {
    const { exec } = fakeGit({ 'ls-tree': MIGRATIONS_PATH, show: new Error('bad object') });

    expect(() => readBase('main', exec)).toThrow('bad object');
  });
});

describe('checkMigrationGate', () => {
  it('passes a title without a bang whatever the migrations say', () => {
    expect(
      checkMigrationGate({ title: 'feat(core): add', body: '', base: BASE, head: BASE }).ok,
    ).toBe(true);
  });

  it('passes a breaking title with a new migration key', () => {
    const verdict = checkMigrationGate({
      title: 'feat(core)!: rename',
      body: '',
      base: BASE,
      head: withKeys('migration-v0.1.0', 'migration-v0.2.0'),
    });

    expect(verdict).toEqual({ ok: true, message: 'New migration: migration-v0.2.0.' });
  });

  it('passes a breaking title the body declares not migratable', () => {
    const verdict = checkMigrationGate({
      title: 'feat(core)!: rename',
      body: 'Migration: not migratable',
      base: BASE,
      head: BASE,
    });

    expect(verdict.ok).toBe(true);
  });

  it('fails a breaking title with an unchanged migrations.json', () => {
    const verdict = checkMigrationGate({
      title: 'feat(core)!: rename',
      body: '',
      base: BASE,
      head: BASE,
    });

    expect(verdict.ok).toBe(false);
    expect(verdict.message).toMatch(
      /needs a new key in projects\/core\/schematics\/migrations\/migrations\.json/,
    );
  });

  it('fails a breaking title whose migrations change is a fixture or reword only', () => {
    const reworded = BASE.replace('"d"', '"reworded"');

    expect(checkMigrationGate({ title: 'fix!: x', body: '', base: BASE, head: reworded }).ok).toBe(
      false,
    );
  });

  it('fails a breaking title that removes a key', () => {
    expect(
      checkMigrationGate({ title: 'fix!: x', body: '', base: BASE, head: withKeys() }).ok,
    ).toBe(false);
  });
});
