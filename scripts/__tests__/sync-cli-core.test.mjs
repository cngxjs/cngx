// Source: scripts/sync-cli-core.mjs and the RULE ZERO contract in its header:
// the sync only ever writes and removes inside the copy tree, and a canonical
// tree that is missing or empty is a broken checkout, never "the core has no
// files", so it must refuse instead of deleting the whole copy. Every case runs
// on throwaway trees under the OS temp dir, never on the real packages.
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { runCopyCheck } from '../cli-core-copy-check.mjs';
import { main, syncCliCore } from '../sync-cli-core.mjs';

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

    expect(result).toEqual({ copied: 2, removed: ['gone.ts'], stray: [] });
    expect(readFileSync(join(dirs.copyDir, 'command.ts'), 'utf8')).toBe('a\n');
    expect(readFileSync(join(dirs.copyDir, 'data/loader.ts'), 'utf8')).toBe('b\n');
    expect(existsSync(join(dirs.copyDir, 'gone.ts'))).toBe(false);
  });

  it('is idempotent on a clean tree', () => {
    const dirs = makeRoot();
    plant(dirs.canonicalDir, { 'command.ts': 'a\n' });

    syncCliCore(dirs);

    expect(syncCliCore(dirs)).toEqual({ copied: 1, removed: [], stray: [] });
  });

  it('reports a hand-written spec and a dotfile in the copy and never deletes them', () => {
    const dirs = makeRoot();
    plant(dirs.canonicalDir, { 'command.ts': 'a\n' });
    plant(dirs.copyDir, { 'command.spec.ts': 'hand\n', '.DS_Store': 'x' });

    const result = syncCliCore(dirs);

    expect(result.stray).toEqual(['.DS_Store', 'command.spec.ts']);
    expect(readFileSync(join(dirs.copyDir, 'command.spec.ts'), 'utf8')).toBe('hand\n');
    expect(existsSync(join(dirs.copyDir, '.DS_Store'))).toBe(true);
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

describe('syncCliCore on a tree it must not touch', () => {
  /** Every entry under `dir` without following links: file bytes, link targets, directories. */
  function snapshot(dir) {
    if (!existsSync(dir)) {
      return null;
    }
    if (!lstatSync(dir).isDirectory()) {
      return { '': readFileSync(dir, 'utf8') };
    }
    const entries = {};
    const walk = (current, prefix) => {
      for (const entry of readdirSync(current, { withFileTypes: true })) {
        const abs = join(current, entry.name);
        const rel = `${prefix}${entry.name}`;
        if (entry.isSymbolicLink()) {
          entries[rel] = `-> ${readlinkSync(abs)}`;
        } else if (entry.isDirectory()) {
          entries[`${rel}/`] = 'dir';
          walk(abs, `${rel}/`);
        } else {
          entries[rel] = readFileSync(abs, 'utf8');
        }
      }
    };
    walk(dir, '');
    return entries;
  }

  function expectRefusedUntouched(dirs, message) {
    const before = [snapshot(dirs.canonicalDir), snapshot(dirs.copyDir)];
    const lines = [];

    const code = main({ ...dirs, stdout: (text) => lines.push(text), stderr: (text) => lines.push(text) });

    expect(code).toBe(1);
    expect(lines.join('')).toContain(message);
    expect(lines.join('')).not.toMatch(/^\s+at /m);
    expect([snapshot(dirs.canonicalDir), snapshot(dirs.copyDir)]).toEqual(before);
  }

  it('refuses a file as canonical root', () => {
    const dirs = makeRoot();
    plant(dirs.copyDir, { 'command.ts': 'keep\n', 'gone.ts': 'old\n' });
    writeFileSync(dirs.canonicalDir, 'not a directory\n');

    expectRefusedUntouched(dirs, 'mcp-core is not a directory');
  });

  it('refuses a file as copy root', () => {
    const dirs = makeRoot();
    plant(dirs.canonicalDir, { 'command.ts': 'a\n' });
    writeFileSync(dirs.copyDir, 'not a directory\n');

    expectRefusedUntouched(dirs, 'cli-core is not a directory');
  });

  it('refuses a symlinked file in the canonical tree', () => {
    const dirs = makeRoot();
    plant(dirs.canonicalDir, { 'command.ts': 'a\n' });
    plant(dirs.copyDir, { 'command.ts': 'stale\n', 'gone.ts': 'old\n' });
    symlinkSync(join(dirs.canonicalDir, 'command.ts'), join(dirs.canonicalDir, 'linked.ts'));

    expectRefusedUntouched(dirs, 'mcp-core/linked.ts is a symlink');
  });

  it('refuses a symlinked file in the copy tree', () => {
    const dirs = makeRoot();
    plant(dirs.canonicalDir, { 'command.ts': 'a\n' });
    plant(dirs.copyDir, { 'command.ts': 'stale\n' });
    symlinkSync(join(dirs.canonicalDir, 'command.ts'), join(dirs.copyDir, 'gone.ts'));

    expectRefusedUntouched(dirs, 'cli-core/gone.ts is a symlink');
  });
});

describe('sync and copy check together', () => {
  it('a synced copy passes the copy check', () => {
    const dirs = makeRoot();
    plant(dirs.canonicalDir, { 'command.ts': 'a\n', 'data/loader.ts': 'b\n' });
    plant(dirs.copyDir, { 'command.ts': 'stale\n' });

    syncCliCore(dirs);

    expect(runCopyCheck({ ...dirs, write: () => undefined })).toBe(0);
  });

  it.each(['zod-source.core-spec.ts', 'query.spec.ts'])(
    'never copies %s and reports it as a stray when it sits in the copy',
    (file) => {
      const dirs = makeRoot();
      plant(dirs.canonicalDir, { 'command.ts': 'a\n', [file]: 'test only\n' });
      plant(dirs.copyDir, { [file]: 'planted\n' });

      const result = syncCliCore(dirs);

      expect(result).toEqual({ copied: 1, removed: [], stray: [file] });
      expect(readFileSync(join(dirs.copyDir, file), 'utf8')).toBe('planted\n');
      expect(runCopyCheck({ ...dirs, write: () => undefined })).toBe(1);
    },
  );

  it.each(['query.test.ts', '__fixtures__/surface.json', 'testing/helper.ts', 'query.spec.mts'])(
    'copies %s like any core file, so the copy check passes',
    (file) => {
      const dirs = makeRoot();
      plant(dirs.canonicalDir, { 'command.ts': 'a\n', [file]: 'core\n' });

      const result = syncCliCore(dirs);

      expect(result).toEqual({ copied: 2, removed: [], stray: [] });
      expect(readFileSync(join(dirs.copyDir, file), 'utf8')).toBe('core\n');
      expect(runCopyCheck({ ...dirs, write: () => undefined })).toBe(0);
    },
  );
});

describe('main', () => {
  it('exits 1 on a refused sync and 0 on a sync', () => {
    const dirs = makeRoot();
    const lines = [];
    const io = { stdout: (text) => lines.push(text), stderr: (text) => lines.push(text) };

    expect(main({ ...dirs, ...io })).toBe(1);
    expect(lines.join('')).toContain('cli:sync - refused');

    plant(dirs.canonicalDir, { 'command.ts': 'a\n' });

    expect(main({ ...dirs, ...io })).toBe(0);
  });
});
