import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type Codemod, createMemoryTree, EMPTY_RENAME_TABLE, type RenameTable } from '../engine';
import { type InstallManifest, type ProjectRecord } from '../ng-add/steps/manifest';
import { readFixture, readMigrationFixture, readTree, runRule } from '../testing/run-schematic';
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
  return createMigration({ renames: RENAMES, codemods, bundleDir: join(__dirname, '0.2.0') });
}

// Two applications onboarded by an older release: \`alpha\` at the root,
// \`beta\` a copy of the stock app under projects/beta.
function twoRecordedApplications(projects: readonly string[] = ['alpha', 'beta']): Record<string, string> {
  const app = readFixture('standalone-app');
  const { before } = readMigrationFixture('0.1.0');
  const record = (JSON.parse(before['.cngx/install.json'] ?? '{}') as InstallManifest).projects['fixture-app'];
  const workspace = JSON.parse(app['angular.json'] ?? '{}') as { projects: Record<string, Record<string, unknown>> };
  const alpha = workspace.projects['fixture-app'];
  const beta = { ...(JSON.parse(JSON.stringify(alpha)) as Record<string, unknown>), root: 'projects/beta', sourceRoot: 'projects/beta/src' };
  workspace.projects = { alpha, beta };
  const betaFiles = Object.fromEntries(
    Object.entries(app)
      .filter(([path]) => path.startsWith('src/'))
      .map(([path, content]) => [`projects/beta/${path}`, content]),
  );
  return {
    ...app,
    ...betaFiles,
    'angular.json': JSON.stringify(workspace, null, 2),
    '.cngx/install.json': JSON.stringify(
      { schemaVersion: 2, projects: Object.fromEntries(projects.map((project) => [project, record])) },
      null,
      2,
    ),
  };
}

function recordsOf(tree: { readText(path: string): string }): Record<string, ProjectRecord> {
  return (JSON.parse(tree.readText('.cngx/install.json')) as InstallManifest).projects;
}

// The entry a CLI run of the synthetic release would pass.
const ENTRY = { name: 'migration-v0.2.0', version: '0.2.0' };

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

    const { tree } = await runRule(migration(), createMemoryTree(before), ENTRY);

    expect(readTree(tree)).toEqual(after);
  });

  it('prints the renames and the codemod plan before applying them', async () => {
    const { before } = readMigrationFixture('rename');

    const { logs } = await runRule(migration([ADDS_NOTE]), createMemoryTree(before), ENTRY);

    expect(logs[0]).toBe('cngx 0.2.0 migration');
    expect(logs[1]).toBe('Planned (2):');
    expect(logs).toContain('  + Rename cngx APIs in src/app/app.html - renamed in this cngx release');
    expect(logs).toContain('  + Rename cngx APIs in src/app/app.ts - renamed in this cngx release');
    expect(logs.join('\n')).toContain('Review the card elevation - `elevated` became a skin');
    expect(logs.indexOf('cngx 0.2.0 migration planned 2 changes.')).toBeGreaterThan(logs.indexOf('Planned (2):'));
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

    await runRule(migration([spy]), createMemoryTree(before), ENTRY);

    expect(seen).toEqual([after['src/app/app.html']]);
  });

  it('is idempotent', async () => {
    const { after } = readMigrationFixture('rename');

    const { tree } = await runRule(migration(), createMemoryTree(after), ENTRY);

    expect(tree.actions).toEqual([]);
  });

  it('re-runs every recorded project and updates each record', async () => {
    const { tree } = await runRule(migration(), createMemoryTree(twoRecordedApplications()), ENTRY);
    const records = recordsOf(tree);

    expect(records['alpha']?.cngxVersion).not.toBe('0.1.0-rc.4');
    expect(records['beta']?.cngxVersion).toBe(records['alpha']?.cngxVersion);
    expect(records['beta']?.updatedAt).toBe('2026-10-12T12:00:00.000Z');
  });

  it('plans the workspace readme once when the first record cannot carry it', async () => {
    const recorded = twoRecordedApplications();
    const { projects } = JSON.parse(recorded['.cngx/install.json'] ?? '{}') as InstallManifest;
    const stale = (record: ProjectRecord | undefined) => ({
      ...record,
      mcpVersion: '0.0.1',
      answers: { ...record?.answers, aiTools: ['claude'] },
    });
    const withRecords = (alpha: object) => ({
      ...recorded,
      '.cngx/install.json': JSON.stringify({ schemaVersion: 2, projects: { alpha, beta: stale(projects['beta']) } }),
    });
    const files = withRecords(stale(projects['alpha']));
    const unreadable = withRecords({ ...stale(projects['alpha']), answers: { preset: 'gone' } });

    const current = withRecords({ ...stale(projects['alpha']), mcpVersion: '0.2.0' });

    const { logs } = await runRule(migration(), createMemoryTree(unreadable), ENTRY);
    const { logs: readable } = await runRule(migration(), createMemoryTree(files), ENTRY);
    const { logs: pinned } = await runRule(migration(), createMemoryTree(current), ENTRY);
    const readmeLines = (lines: readonly string[]) => lines.filter((line) => line.startsWith('  - ') && line.includes('.cngx/README.md'));

    expect(readmeLines(readable)).toEqual([expect.stringContaining('--project alpha')]);
    expect(readmeLines(logs)).toEqual([expect.stringContaining('--project beta')]);
    expect(readmeLines(pinned)).toEqual([expect.stringContaining('--project beta')]);
  });

  it('names a recorded project that is gone and leaves its record', async () => {
    const files = twoRecordedApplications(['alpha', 'gone']);

    const { tree, logs } = await runRule(migration(), createMemoryTree(files), ENTRY);

    expect(logs).toContain(
      '  - Re-run the recorded install steps for gone - Project "gone" not found in angular.json. Its record in .cngx/install.json is kept as it is.',
    );
    expect(recordsOf(tree)['gone']).toEqual(recordsOf(createMemoryTree(files))['gone']);
    expect(recordsOf(tree)['alpha']?.updatedAt).toBe('2026-10-12T12:00:00.000Z');
  });

  it.each(['not json', JSON.stringify({ schemaVersion: 1 })])('says it cannot read %s and leaves it alone', async (content) => {
    const { before } = readMigrationFixture('rename');
    const files = { ...before, '.cngx/install.json': content };

    const { tree, logs } = await runRule(migration(), createMemoryTree(files), ENTRY);

    expect(tree.readText('.cngx/install.json')).toBe(content);
    expect(logs).toContain(
      '  - Re-run the recorded install steps - .cngx/install.json exists but cngx cannot read it and leaves it as it is; ng add @cngx/core --project <name> keeps it as a copy and starts a new install record',
    );
  });
});
