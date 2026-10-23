import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMemoryTree, createProvenanceStamp, DEFAULT_MCP_VERSION, EMPTY_RENAME_TABLE } from '../../engine';
import { helperReadmeFingerprintLine } from '../../ng-add/detect/detect';
import { type InstallManifest, type ProjectRecord } from '../../ng-add/steps/manifest';
import { readFixture, readMigrationFixture, readTree, runRule } from '../../testing/run-schematic';
import { createMigration } from '../migration';
import { migrate } from './index';

const NOW = '2026-10-12T12:00:00.000Z';
const OLDER_MCP = '0.1.0';

const PROVENANCE = { source: 'ng-add', version: '0.1.0-rc.4' } as const;

// An app onboarded by an older release with Claude Code wired: the helper
// README cngx wrote then still pins the MCP release of that install.
function onboardedWithAiTools(): Readonly<Record<string, string>> {
  const { before } = readMigrationFixture('refresh');
  const manifest = recordOf(before);
  const recorded: ProjectRecord = {
    ...manifest,
    mcpVersion: OLDER_MCP,
    answers: { ...manifest.answers, aiTools: ['claude'] },
    steps: [
      ...manifest.steps,
      { id: 'ai-tools:claude', outcome: 'satisfied', provenance: PROVENANCE },
      { id: 'helper-readme:file', outcome: 'satisfied', provenance: PROVENANCE },
    ],
  };
  return {
    ...before,
    '.cngx/install.json': JSON.stringify({ schemaVersion: 2, projects: { 'fixture-app': recorded } }, null, 2),
    '.mcp.json': JSON.stringify({
      mcpServers: { cngx: { command: 'npx', args: ['-y', `@cngx/mcp@${OLDER_MCP}`] } },
    }),
    '.cngx/README.md': `${createProvenanceStamp('ng-add', '0.1.0-rc.4', 'html')}${helperReadmeFingerprintLine('0badc0de')}\n\nolder README\n`,
  };
}

function recordOf(files: Readonly<Record<string, string>>): ProjectRecord {
  const manifest = JSON.parse(files['.cngx/install.json'] ?? '{}') as InstallManifest;
  const record = manifest.projects['fixture-app'];
  if (record === undefined) {
    throw new Error('no install record for fixture-app');
  }
  return record;
}

describe('refresh migration', () => {
  const isTTY = process.stdout.isTTY;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(NOW));
    process.stdout.isTTY = false;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    process.stdout.isTTY = isTTY;
  });

  it('moves the manifest to the release the bundle ships', async () => {
    const { before, after } = readMigrationFixture('refresh');

    const { tree } = await runRule(migrate(), createMemoryTree(before));

    expect(readTree(tree)).toEqual(after);
  });

  it('falls back to the release of the package manifest without a versions.json', async () => {
    const { before, after } = readMigrationFixture('refresh');

    const { logs } = await runRule(migrate(), createMemoryTree(before));

    expect(logs[0]).toBe(`cngx ${recordOf(after).cngxVersion} migration`);
    expect(logs.some((line) => line.includes('No usable versions.json'))).toBe(true);
  });

  it('names and records the releases of a versions.json beside the bundle outside a collection', async () => {
    const schematicsDir = join(mkdtempSync(join(tmpdir(), 'cngx-refresh-')), 'schematics');
    const bundleDir = join(schematicsDir, 'migrations', 'refresh');
    mkdirSync(bundleDir, { recursive: true });
    writeFileSync(
      join(schematicsDir, 'versions.json'),
      JSON.stringify({ cngx: '9.9.0', mcp: '9.9.1', eslintPlugin: '9.9.2', angular: '>=21.1.0 <23.0.0' }),
    );
    const { before } = readMigrationFixture('refresh');

    try {
      // What `migrate` builds, run from a bundle folder publish stamped.
      const rule = createMigration({ renames: EMPTY_RENAME_TABLE, codemods: [], bundleDir });
      const { tree, logs } = await runRule(rule, createMemoryTree(before));

      expect(logs[0]).toBe('cngx 9.9.0 migration');
      expect(logs.some((line) => line.includes('No usable versions.json'))).toBe(false);
      expect(recordOf(readTree(tree))).toMatchObject({ cngxVersion: '9.9.0', mcpVersion: '9.9.1', eslintPluginVersion: '9.9.2' });
    } finally {
      rmSync(dirname(schematicsDir), { recursive: true, force: true });
    }
  });

  it('names the release of the collection entry that ran', async () => {
    const { before } = readMigrationFixture('refresh');

    const { logs } = await runRule(migrate(), createMemoryTree(before), {
      name: 'migration-v0.1.1-refresh',
      version: '0.1.1',
    });

    expect(logs[0]).toBe('cngx 0.1.1 migration');
    expect(logs).toContain('cngx 0.1.1 migration applied 1 change.');
  });

  it('regenerates the helper README once the MCP release moved', async () => {
    const { tree, logs } = await runRule(migrate(), createMemoryTree(onboardedWithAiTools()));
    const files = readTree(tree);

    expect(logs.join('\n')).toContain('Update .cngx/README.md');
    expect(files['.cngx/README.md']).toContain(`\`@cngx/mcp@${DEFAULT_MCP_VERSION}\``);
    expect(files['.cngx/README.md']).not.toContain('older README');
    expect(recordOf(files).mcpVersion).toBe(DEFAULT_MCP_VERSION);
  });

  it('plans nothing on a second run', async () => {
    const first = await runRule(migrate(), createMemoryTree(onboardedWithAiTools()));

    const { tree } = await runRule(migrate(), createMemoryTree(readTree(first.tree)));

    expect(tree.actions).toEqual([]);
  });

  it('runs under an interactive terminal through the live task list', async () => {
    const { before, after } = readMigrationFixture('refresh');
    process.stdout.isTTY = true;
    vi.stubEnv('CI', '');
    vi.stubEnv('NO_COLOR', '');
    vi.stubEnv('FORCE_COLOR', '1');

    const { tree, logs } = await runRule(migrate(), createMemoryTree(before));

    expect(readTree(tree)).toEqual(after);
    expect(logs).not.toContain('Planned (1):');
    expect(logs).toContain(`cngx ${recordOf(after).cngxVersion} migration applied 1 change.`);
  });

  it('plans one note for a missing manifest and changes nothing', async () => {
    const app = readFixture('standalone-app');

    const { tree, logs } = await runRule(migrate(), createMemoryTree(app));

    expect(readTree(tree)).toEqual(app);
    const notes = logs.filter((line) =>
      line.startsWith('  - Re-run the recorded install steps - no .cngx/install.json'),
    );
    expect(notes).toHaveLength(1);
    expect(notes[0]).toContain(
      'ng add @cngx/core --project <name> records the install, so later updates re-check it',
    );
    expect(logs).toContain('Next steps:');
  });
});
