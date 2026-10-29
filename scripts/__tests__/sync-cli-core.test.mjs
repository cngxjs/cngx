// Source: scripts/sync-cli-core.mjs and the RULE ZERO contract in its header:
// the sync only ever writes and removes inside the copy tree, and a canonical
// tree that is missing or empty is a broken checkout, never "the core has no
// files", so it must refuse instead of deleting the whole copy. Every case runs
// on throwaway trees under the OS temp dir, never on the real packages.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { syncCliCore } from '../sync-cli-core.mjs';

const roots = [];

function makeRoot() {
  const root = mkdtempSync(join(tmpdir(), 'cngx-sync-cli-core-'));
  roots.push(root);
  return { canonicalDir: join(root, 'mcp-core'), copyDir: join(root, 'cli-core') };
}

function plant(dir, tree) {
  for (const [file, content] of Object.entries(tree)) {
    mkdirSync(dirname(join(dir, file)), { recursive: true });
    writeFileSync(join(dir, file), content);
  }
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe('syncCliCore', () => {
  it('copies the canonical tree and removes a copy file the canonical tree no longer has', () => {
    const dirs = makeRoot();
    plant(dirs.canonicalDir, { 'command.ts': 'a\n', 'data/loader.ts': 'b\n' });
    plant(dirs.copyDir, { 'command.ts': 'stale\n', 'gone.ts': 'old\n' });

    const result = syncCliCore(dirs);

    expect(result).toEqual({ copied: 2, removed: ['gone.ts'] });
    expect(readFileSync(join(dirs.copyDir, 'command.ts'), 'utf8')).toBe('a\n');
    expect(readFileSync(join(dirs.copyDir, 'data/loader.ts'), 'utf8')).toBe('b\n');
    expect(existsSync(join(dirs.copyDir, 'gone.ts'))).toBe(false);
  });

  it('is idempotent on a clean tree', () => {
    const dirs = makeRoot();
    plant(dirs.canonicalDir, { 'command.ts': 'a\n' });

    syncCliCore(dirs);

    expect(syncCliCore(dirs)).toEqual({ copied: 1, removed: [] });
  });

  it('refuses and deletes nothing when the canonical tree is missing', () => {
    const dirs = makeRoot();
    plant(dirs.copyDir, { 'command.ts': 'keep\n' });

    const result = syncCliCore(dirs);

    expect(result.refused).toContain('does not exist');
    expect(readFileSync(join(dirs.copyDir, 'command.ts'), 'utf8')).toBe('keep\n');
  });

  it('refuses and deletes nothing when the canonical tree is empty', () => {
    const dirs = makeRoot();
    mkdirSync(dirs.canonicalDir, { recursive: true });
    plant(dirs.copyDir, { 'command.ts': 'keep\n' });

    const result = syncCliCore(dirs);

    expect(result.refused).toContain('no core files');
    expect(readFileSync(join(dirs.copyDir, 'command.ts'), 'utf8')).toBe('keep\n');
  });
});
