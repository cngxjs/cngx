import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMemoryTree, createProvenanceStamp, DEFAULT_MCP_VERSION } from '../../engine';
import { helperReadmeFingerprintLine } from '../../ng-add/detect/detect';
import { type InstallManifest } from '../../ng-add/steps/manifest';
import { readFixture, readMigrationFixture, readTree, runRule } from '../../testing/run-schematic';
import { migrate } from './index';

const NOW = '2026-10-12T12:00:00.000Z';
const OLDER_MCP = '0.1.0';

const PROVENANCE = { source: 'ng-add', version: '0.1.0-rc.4' } as const;

// An app onboarded by an older release with Claude Code wired: the helper
// README cngx wrote then still pins the MCP release of that install.
function onboardedWithAiTools(): Readonly<Record<string, string>> {
  const { before } = readMigrationFixture('0.1.0');
  const manifest = JSON.parse(before['.cngx/install.json'] ?? '{}') as InstallManifest;
  const recorded: InstallManifest = {
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
    '.cngx/install.json': JSON.stringify(recorded, null, 2),
    '.mcp.json': JSON.stringify({
      mcpServers: { cngx: { command: 'npx', args: ['-y', `@cngx/mcp@${OLDER_MCP}`] } },
    }),
    '.cngx/README.md': `${createProvenanceStamp('ng-add', '0.1.0-rc.4', 'html')}${helperReadmeFingerprintLine('0badc0de')}\n\nolder README\n`,
  };
}

function manifestOf(files: Readonly<Record<string, string>>): InstallManifest {
  return JSON.parse(files['.cngx/install.json'] ?? '{}') as InstallManifest;
}

describe('refresh migration', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(NOW));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('moves the manifest to the release the bundle ships', async () => {
    const { before, after } = readMigrationFixture('0.1.0');

    const { tree } = await runRule(migrate(), createMemoryTree(before));

    expect(readTree(tree)).toEqual(after);
  });

  it('takes the release for its header from versions.json', async () => {
    const { before, after } = readMigrationFixture('0.1.0');

    const { logs } = await runRule(migrate(), createMemoryTree(before));

    expect(logs[0]).toBe(`cngx ${manifestOf(after).cngxVersion} migration`);
  });

  it('regenerates the helper README once the MCP release moved', async () => {
    const { tree, logs } = await runRule(migrate(), createMemoryTree(onboardedWithAiTools()));
    const files = readTree(tree);

    expect(logs[1]).toContain('Update .cngx/README.md');
    expect(files['.cngx/README.md']).toContain(`\`@cngx/mcp@${DEFAULT_MCP_VERSION}\``);
    expect(files['.cngx/README.md']).not.toContain('older README');
    expect(manifestOf(files).mcpVersion).toBe(DEFAULT_MCP_VERSION);
  });

  it('plans nothing on a second run', async () => {
    const first = await runRule(migrate(), createMemoryTree(onboardedWithAiTools()));

    const { tree } = await runRule(migrate(), createMemoryTree(readTree(first.tree)));

    expect(tree.actions).toEqual([]);
  });

  it('names the missing manifest once and changes nothing', async () => {
    const app = readFixture('standalone-app');

    const { tree, logs } = await runRule(migrate(), createMemoryTree(app));

    expect(readTree(tree)).toEqual(app);
    expect(logs[1]?.match(/no \.cngx\/install\.json from ng add/g)).toHaveLength(1);
  });
});
