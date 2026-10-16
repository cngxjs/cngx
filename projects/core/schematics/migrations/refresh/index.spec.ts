import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMemoryTree, createProvenanceStamp, DEFAULT_MCP_VERSION } from '../../engine';
import { helperReadmeFingerprintLine } from '../../ng-add/detect/detect';
import { type InstallManifest, type ProjectRecord } from '../../ng-add/steps/manifest';
import { readFixture, readMigrationFixture, readTree, runRule } from '../../testing/run-schematic';
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

  it('falls back to the release in versions.json outside a collection', async () => {
    const { before, after } = readMigrationFixture('refresh');

    const { logs } = await runRule(migrate(), createMemoryTree(before));

    expect(logs[0]).toBe(`cngx ${recordOf(after).cngxVersion} migration`);
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

    const written: string[] = [];
    const write = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      written.push(String(chunk));
      return true;
    });
    try {
      const { tree, logs } = await runRule(migrate(), createMemoryTree(before));

      expect(readTree(tree)).toEqual(after);
      expect(logs).toEqual([]);
      expect(written).not.toContain('Planned (1):\n');
      expect(written).toContain(`cngx ${recordOf(after).cngxVersion} migration applied 1 change.\n`);
    } finally {
      write.mockRestore();
    }
  });

  it('plans one note for a missing manifest and changes nothing', async () => {
    const app = readFixture('standalone-app');

    const { tree, logs } = await runRule(migrate(), createMemoryTree(app));

    expect(readTree(tree)).toEqual(app);
    expect(
      logs.filter((line) =>
        line.startsWith('  - Re-run the recorded install steps - no .cngx/install.json'),
      ),
    ).toHaveLength(1);
    expect(logs).toContain('Next steps:');
  });
});
