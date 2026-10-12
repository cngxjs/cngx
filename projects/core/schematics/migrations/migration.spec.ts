import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type Codemod, createMemoryTree, EMPTY_RENAME_TABLE, type RenameTable } from '../engine';
import { type InstallManifest } from '../ng-add/steps/manifest';
import { readMigrationFixture, readTree, runRule } from '../testing/run-schematic';
import { createMigration } from './migration';

// A synthetic release: nothing cngx shipped was named like this.
const RENAMES: RenameTable = {
  ...EMPTY_RENAME_TABLE,
  classes: { CngxOldCard: 'CngxCard' },
  selectors: { 'cngx-old-card': 'cngx-card' },
  inputs: [{ owner: 'cngx-old-card', from: 'heading', to: 'title' }],
  outputs: [{ owner: 'cngx-old-card', from: 'dismissed', to: 'closed' }],
  tokens: { CNGX_OLD_CARD_CONFIG: 'CNGX_CARD_CONFIG' },
  importPaths: { '@cngx/common/old-card': '@cngx/common/card' },
};

const ADDS_NOTE: Codemod<InstallManifest | undefined> = {
  id: 'card-elevation',
  from: '0.1.0',
  to: '0.2.0',
  plan: (tree) => ({
    changes: tree.readText('src/app/app.ts').includes('elevated')
      ? [
          {
            kind: 'note',
            id: 'codemod:card-elevation',
            label: 'Review the card elevation',
            reason: '`elevated` became a skin',
            provenance: { source: 'ng-update', version: '0.2.0' },
          },
        ]
      : [],
    skipped: [],
  }),
};

// A migration entry sits one folder below this one.
function migration(codemods: readonly Codemod<InstallManifest | undefined>[] = []) {
  return createMigration({ version: '0.2.0', renames: RENAMES, codemods, bundleDir: join(__dirname, '0.2.0') });
}

describe('createMigration', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-12T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('applies the rename table across sources and templates', async () => {
    const { before, after } = readMigrationFixture('rename');

    const { tree } = await runRule(migration(), createMemoryTree(before));

    expect(readTree(tree)).toEqual(after);
  });

  it('names every renamed file and prints the codemod plan', async () => {
    const { before } = readMigrationFixture('rename');

    const { logs } = await runRule(migration([ADDS_NOTE]), createMemoryTree(before));

    expect(logs[0]).toBe('cngx 0.2.0 migration');
    expect(logs[1]).toContain('Review the card elevation - `elevated` became a skin');
    expect([...logs.slice(2)].sort()).toEqual(['Renamed cngx APIs in src/app/app.html', 'Renamed cngx APIs in src/app/app.ts']);
  });

  it('plans the codemods on the tree before the renames', async () => {
    const { before } = readMigrationFixture('rename');
    const seen: string[] = [];
    const spy: Codemod<InstallManifest | undefined> = {
      ...ADDS_NOTE,
      plan: (tree) => {
        seen.push(tree.readText('src/app/app.html'));
        return { changes: [], skipped: [] };
      },
    };

    await runRule(migration([spy]), createMemoryTree(before));

    expect(seen).toEqual([before['src/app/app.html']]);
  });

  it('is idempotent', async () => {
    const { after } = readMigrationFixture('rename');

    const { tree } = await runRule(migration(), createMemoryTree(after));

    expect(tree.actions).toEqual([]);
  });
});
