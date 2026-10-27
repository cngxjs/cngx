import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  CANONICAL_CORE_DIR,
  COPY_CORE_DIR,
  compareTrees,
  isCoreFile,
  listCoreFiles,
  missingTrees,
} from '../cli-core-copy-check.mjs';

const SCRIPT = fileURLToPath(new URL('../cli-core-copy-check.mjs', import.meta.url));
const ROOT = fileURLToPath(new URL('../..', import.meta.url));

// In-memory trees: { 'rel/path.ts': 'content' }.
const reader = (tree) => (file) => Buffer.from(tree[file]);
const compare = (canonical, copy) =>
  compareTrees(Object.keys(canonical).sort(), Object.keys(copy).sort(), reader(canonical), reader(copy));

const CANONICAL = {
  'command.ts': 'export type A = 1;\n',
  'commands/get-api.ts': 'export const getApi = 1;\n',
  'data/loader.ts': 'export const load = 1;\n',
};

describe('compareTrees', () => {
  it('passes identical trees', () => {
    expect(compare(CANONICAL, { ...CANONICAL })).toEqual([]);
  });

  it('fails one changed byte in a nested file', () => {
    const copy = { ...CANONICAL, 'data/loader.ts': 'export const load = 2;\n' };

    expect(compare(CANONICAL, copy)).toEqual([{ file: 'data/loader.ts', reason: 'bytes differ' }]);
  });

  it('fails a file that exists only in the canonical tree', () => {
    const canonical = { ...CANONICAL, 'data/snapshot-cache.ts': 'export {};\n' };

    expect(compare(canonical, CANONICAL)).toEqual([
      { file: 'data/snapshot-cache.ts', reason: 'missing in the cli copy' },
    ]);
  });

  it('fails a file that exists only in the copy', () => {
    const copy = { ...CANONICAL, 'commands/hand-edit.ts': 'export {};\n' };

    expect(compare(CANONICAL, copy)).toEqual([{ file: 'commands/hand-edit.ts', reason: 'only in the cli copy' }]);
  });
});

describe('listCoreFiles', () => {
  it('walks nested directories, excludes specs and returns sorted posix paths', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cngx-cli-core-'));
    mkdirSync(join(dir, 'commands'));
    mkdirSync(join(dir, 'data', 'deep'), { recursive: true });
    writeFileSync(join(dir, 'registry.ts'), '');
    writeFileSync(join(dir, 'commands', 'get-api.ts'), '');
    writeFileSync(join(dir, 'commands', 'get-api.spec.ts'), '');
    writeFileSync(join(dir, 'data', 'deep', 'x.ts'), '');

    expect(listCoreFiles(dir)).toEqual(['commands/get-api.ts', 'data/deep/x.ts', 'registry.ts']);
  });

  it('treats a missing directory as an empty tree', () => {
    expect(listCoreFiles(join(tmpdir(), 'cngx-cli-core-does-not-exist'))).toEqual([]);
  });

  it('counts every non-spec file as core', () => {
    expect(isCoreFile('data/loader.ts')).toBe(true);
    expect(isCoreFile('data/loader.spec.ts')).toBe(false);
  });
});

describe('tree roots', () => {
  const absent = join(tmpdir(), 'cngx-cli-core-does-not-exist');

  it('fails a missing canonical tree', () => {
    expect(missingTrees(absent, COPY_CORE_DIR)).toEqual([absent]);
  });

  it('fails a missing copy tree', () => {
    expect(missingTrees(CANONICAL_CORE_DIR, absent)).toEqual([absent]);
  });

  it('compares the real trees when started from another directory', () => {
    const run = (cwd) => spawnSync(process.execPath, [SCRIPT], { cwd, encoding: 'utf8' });
    const fromRoot = run(ROOT);
    const fromTmp = run(tmpdir());
    const count = (stdout) => Number(/\((\d+) files\)/.exec(stdout)?.[1] ?? 0);

    expect(fromRoot.status).toBe(0);
    expect(count(fromRoot.stdout)).toBe(listCoreFiles(CANONICAL_CORE_DIR).length);
    expect(count(fromRoot.stdout)).toBeGreaterThan(0);
    expect(fromTmp.status).toBe(0);
    expect(count(fromTmp.stdout)).toBe(count(fromRoot.stdout));
  });
});
