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
  const isTTY = process.stdout.isTTY;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-12T12:00:00.000Z'));
    process.stdout.isTTY = false;
  });

  afterEach(() => {
    vi.useRealTimers();
    process.stdout.isTTY = isTTY;
  });

  it('applies the rename table across sources and templates', async () => {
    const { before, after } = readMigrationFixture('rename');

    const { tree } = await runRule(migration(), createMemoryTree(before));

    expect(readTree(tree)).toEqual(after);
  });

  it('prints the renames and the codemod plan before applying them', async () => {
    const { before } = readMigrationFixture('rename');

    const { logs } = await runRule(migration([ADDS_NOTE]), createMemoryTree(before));

    expect(logs[0]).toBe('cngx 0.2.0 migration');
    expect(logs[1]).toBe('Planned (2):');
    expect(logs).toContain('  + Rename cngx APIs in src/app/app.html - renamed in this cngx release');
    expect(logs).toContain('  + Rename cngx APIs in src/app/app.ts - renamed in this cngx release');
    expect(logs.join('\n')).toContain('Review the card elevation - `elevated` became a skin');
    expect(logs.indexOf('cngx planned 2 changes.')).toBeGreaterThan(logs.indexOf('Planned (2):'));
    expect(logs).toContain('Next steps:');
  });

  it('plans the codemods on the renamed tree and leaves the real tree to the apply', async () => {
    const { before, after } = readMigrationFixture('rename');
    const seen: string[] = [];
    const spy: Codemod<InstallManifest | undefined> = {
      ...ADDS_NOTE,
      plan: (tree) => {
        seen.push(tree.readText('src/app/app.html'));
        return { changes: [], skipped: [] };
      },
    };

    await runRule(migration([spy]), createMemoryTree(before));

    expect(seen).toEqual([after['src/app/app.html']]);
  });

  it('is idempotent', async () => {
    const { after } = readMigrationFixture('rename');

    const { tree } = await runRule(migration(), createMemoryTree(after));

    expect(tree.actions).toEqual([]);
  });
});
