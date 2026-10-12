import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMemoryTree } from '../../engine';
import { readFixture, readMigrationFixture, readTree, runRule } from '../../testing/run-schematic';
import { migrate } from './index';

const NOW = '2026-10-12T12:00:00.000Z';

describe('migration 0.1.0', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(NOW));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renames nothing and records the release in the install manifest', async () => {
    const { before, after } = readMigrationFixture('0.1.0');

    const { tree } = await runRule(migrate(), createMemoryTree(before));

    expect(readTree(tree)).toEqual(after);
  });

  it('prints the plan before it applies it', async () => {
    const { before } = readMigrationFixture('0.1.0');

    const { logs } = await runRule(migrate(), createMemoryTree(before));

    expect(logs[0]).toBe('cngx 0.1.0 migration');
    expect(logs[1]).toContain('Update .cngx/install.json - records the cngx release this app now runs');
  });

  it('changes nothing on a second run', async () => {
    const { after } = readMigrationFixture('0.1.0');

    const { tree, logs } = await runRule(migrate(), createMemoryTree(after));

    expect(tree.actions).toEqual([]);
    expect(logs[1]).toContain('Update .cngx/install.json - unchanged since');
  });

  it('runs on an app without an install manifest and says what it skipped', async () => {
    const app = readFixture('standalone-app');

    const { tree, logs } = await runRule(migrate(), createMemoryTree(app));

    expect(readTree(tree)).toEqual(app);
    expect(logs[1]).toContain('no .cngx/install.json from ng add; only the renames and codemods ran');
  });

  it('names a recorded project that is gone instead of failing', async () => {
    const { before } = readMigrationFixture('0.1.0');
    const manifest = JSON.parse(before['.cngx/install.json'] ?? '{}') as { facts: Record<string, unknown> };
    const tree = createMemoryTree({
      ...before,
      '.cngx/install.json': JSON.stringify({ ...manifest, facts: { ...manifest.facts, project: 'gone' } }),
    });

    const { logs } = await runRule(migrate(), tree);

    expect(logs[1]).toContain('Project "gone" not found in angular.json.');
  });
});
