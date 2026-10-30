import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import {
  CANONICAL_CORE_DIR,
  COPY_CORE_DIR,
  compareTrees,
  isCoreFile,
  listCoreFiles,
  listStrayFiles,
  missingTrees,
  runCopyCheck,
} from '../cli-core-copy-check.mjs';

const SCRIPT = fileURLToPath(new URL('../cli-core-copy-check.mjs', import.meta.url));
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const read = (...path) => readFileSync(join(ROOT, ...path), 'utf8');

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

  it('counts every non-spec, non-dotfile file as core', () => {
    expect(isCoreFile('data/loader.ts')).toBe(true);
    expect(isCoreFile('data/loader.spec.ts')).toBe(false);
    expect(isCoreFile('.DS_Store')).toBe(false);
    expect(isCoreFile('data/.cache/x.ts')).toBe(false);
  });
});

describe('runCopyCheck', () => {
  const trees = [];

  function makeTrees(canonical, copy) {
    const root = mkdtempSync(join(tmpdir(), 'cngx-cli-copy-check-'));
    trees.push(root);
    const canonicalDir = join(root, 'mcp-core');
    const copyDir = join(root, 'cli-core');
    for (const [dir, tree] of [[canonicalDir, canonical], [copyDir, copy]]) {
      for (const [file, content] of Object.entries(tree)) {
        mkdirSync(dirname(join(dir, file)), { recursive: true });
        writeFileSync(join(dir, file), content);
      }
    }
    return { canonicalDir, copyDir };
  }

  function check(dirs) {
    let out = '';
    const code = runCopyCheck({ ...dirs, write: (text) => (out += text) });
    return { code, out };
  }

  afterEach(() => {
    for (const root of trees.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('exits 0 on identical trees', () => {
    expect(check(makeTrees(CANONICAL, CANONICAL)).code).toBe(0);
  });

  it('exits 1 on a changed byte', () => {
    const run = check(makeTrees(CANONICAL, { ...CANONICAL, 'command.ts': 'export type A = 2;\n' }));

    expect(run.code).toBe(1);
    expect(run.out).toContain('command.ts (bytes differ)');
  });

  it('mutation: a spec file planted in the copy fails the check', () => {
    const run = check(makeTrees(CANONICAL, { ...CANONICAL, 'commands/get-api.spec.ts': 'it();\n' }));

    expect(run.code).toBe(1);
    expect(run.out).toContain('commands/get-api.spec.ts');
  });

  it('mutation: a dotfile planted in the copy fails the check', () => {
    const run = check(makeTrees(CANONICAL, { ...CANONICAL, 'data/.DS_Store': 'x' }));

    expect(run.code).toBe(1);
    expect(run.out).toContain('data/.DS_Store');
  });

  it('ignores spec files and dotfiles in the canonical tree', () => {
    const canonical = { ...CANONICAL, 'command.spec.ts': 'it();\n', '.editorconfig': 'x' };

    expect(check(makeTrees(canonical, CANONICAL)).code).toBe(0);
  });

  it('fails a copy whose line endings turned CRLF', () => {
    const run = check(makeTrees(CANONICAL, { ...CANONICAL, 'command.ts': 'export type A = 1;\r\n' }));

    expect(run.code).toBe(1);
    expect(run.out).toContain('command.ts (bytes differ)');
  });

  it('copies a .spec.mts file and a testing/ helper like any core file', () => {
    const canonical = { ...CANONICAL, 'query.spec.mts': 'it();\n', 'testing/helper.ts': 'export const h = 1;\n' };

    expect(check(makeTrees(canonical, canonical)).code).toBe(0);
  });

  it('mutation: a .spec.mts file or a testing/ helper missing from the copy fails the check', () => {
    const canonical = { ...CANONICAL, 'query.spec.mts': 'it();\n', 'testing/helper.ts': 'export const h = 1;\n' };
    const run = check(makeTrees(canonical, CANONICAL));

    expect(run.code).toBe(1);
    expect(run.out).toContain('query.spec.mts (missing in the cli copy)');
    expect(run.out).toContain('testing/helper.ts (missing in the cli copy)');
  });

  it('treats an empty directory in either tree as no file and no divergence', () => {
    const dirs = makeTrees(CANONICAL, CANONICAL);
    mkdirSync(join(dirs.canonicalDir, 'empty'));
    mkdirSync(join(dirs.copyDir, 'data', 'empty'));

    expect(check(dirs).code).toBe(0);
  });

  it('lists a file symlink in the copy as a divergence without reading it', () => {
    const dirs = makeTrees(CANONICAL, CANONICAL);
    const other = join(dirs.copyDir, '..', 'other.ts');
    writeFileSync(other, CANONICAL['command.ts']);
    rmSync(join(dirs.copyDir, 'command.ts'));
    symlinkSync(other, join(dirs.copyDir, 'command.ts'));

    const run = check(dirs);

    expect(run.code).toBe(1);
    expect(run.out).toContain('command.ts (missing in the cli copy)');
    expect(run.out).toMatch(/cli-core\/command\.ts \(is a symlink; /);
  });

  it('lists a symlinked directory in the canonical tree without walking it', () => {
    const dirs = makeTrees(CANONICAL, CANONICAL);
    symlinkSync(join(dirs.canonicalDir, 'commands'), join(dirs.canonicalDir, 'linked'));

    const run = check(dirs);

    expect(run.code).toBe(1);
    expect(run.out).toMatch(/mcp-core\/linked \(is a symlink; /);
    expect(run.out).not.toContain('linked/get-api.ts');
  });

  it('exits 1 with a message, not a stack, when a tree root is a file', () => {
    const dirs = makeTrees(CANONICAL, CANONICAL);
    const fileRoot = join(dirs.canonicalDir, 'command.ts');

    const run = check({ ...dirs, canonicalDir: fileRoot });

    expect(run.code).toBe(1);
    expect(run.out).toContain('command.ts is not a directory');
  });

  it('exits 1 on a missing tree', () => {
    const dirs = makeTrees(CANONICAL, CANONICAL);

    expect(check({ ...dirs, copyDir: join(dirs.copyDir, 'nope') }).code).toBe(1);
  });

  it('mutation: an empty canonical tree fails the check', () => {
    const dirs = makeTrees({}, {});
    mkdirSync(dirs.canonicalDir);
    mkdirSync(dirs.copyDir);

    const run = check(dirs);

    expect(run.code).toBe(1);
    expect(run.out).toContain('holds no core files');
  });

  it('mutation: a canonical tree of spec files only fails the check', () => {
    const dirs = makeTrees({ 'command.spec.ts': 'it();\n' }, {});
    mkdirSync(dirs.copyDir);

    const run = check(dirs);

    expect(run.code).toBe(1);
    expect(run.out).toContain('holds no core files');
  });
});

describe('listStrayFiles', () => {
  it('lists spec files and dotfiles at any depth', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cngx-cli-core-stray-'));
    mkdirSync(join(dir, 'data', '.hidden'), { recursive: true });
    writeFileSync(join(dir, 'registry.ts'), '');
    writeFileSync(join(dir, 'registry.spec.ts'), '');
    writeFileSync(join(dir, 'data', '.hidden', 'x.ts'), '');

    expect(listStrayFiles(dir)).toEqual(['data/.hidden/x.ts', 'registry.spec.ts']);
    rmSync(dir, { recursive: true, force: true });
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

describe('the script on a broken tree', () => {
  const roots = [];
  const tempRoot = () => {
    const root = mkdtempSync(join(tmpdir(), 'cngx-cli-copy-check-cli-'));
    roots.push(root);
    return root;
  };
  const runScript = (canonicalDir, copyDir) =>
    spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `import { runCopyCheck } from ${JSON.stringify(SCRIPT)};
         process.exitCode = runCopyCheck({ canonicalDir: process.argv[1], copyDir: process.argv[2], write: (t) => process.stderr.write(t) });`,
        canonicalDir,
        copyDir,
      ],
      { encoding: 'utf8' },
    );

  afterEach(() => {
    for (const root of roots.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('answers a file as canonical root with one line and no stack', () => {
    const root = tempRoot();
    writeFileSync(join(root, 'core'), 'not a directory\n');
    mkdirSync(join(root, 'copy'));

    const run = runScript(join(root, 'core'), join(root, 'copy'));

    expect(run.status).toBe(1);
    expect(run.stderr).toContain('is not a directory');
    expect(run.stderr).not.toMatch(/^\s+at /m);
  });

  it('answers a symlinked file inside the tree as a divergence with no stack', () => {
    const root = tempRoot();
    for (const dir of ['core', 'copy']) {
      mkdirSync(join(root, dir));
      writeFileSync(join(root, dir, 'command.ts'), 'export type A = 1;\n');
    }
    symlinkSync(join(root, 'core', 'command.ts'), join(root, 'copy', 'linked.ts'));

    const run = runScript(join(root, 'core'), join(root, 'copy'));

    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/linked\.ts \(is a symlink; /);
    expect(run.stderr).not.toMatch(/^\s+at /m);
  });
});

// A core path is test-only exactly when a package build excludes its test-file
// pattern and a vitest config includes it. The cli build compiles the copy, so its
// tsconfig must exclude the pattern too; anything else is a core file, copied byte
// for byte, so the copy never drops a file tsc would compile.
describe('the test-only rule agrees with the build and vitest configs', () => {
  const tsconfigExclude = (pkg) => JSON.parse(read('packages', pkg, 'tsconfig.json')).exclude;
  /** The file suffix of every `**\/*<suffix>` glob, e.g. `.spec.ts`. */
  const suffixes = (globs) => globs.map((glob) => /\*\*\/\*(\.[\w.-]+)$/.exec(glob)?.[1]).filter((suffix) => suffix !== undefined);

  async function testOnlySuffixes() {
    const mcpVitest = (await import('../../packages/mcp/vitest.config.mjs')).default;
    const cliCoreVitest = (await import('../../packages/cli/vitest.core.config.mjs')).default;
    const cliExcluded = suffixes(tsconfigExclude('cli'));
    const excluded = new Set([...suffixes(tsconfigExclude('mcp')), ...cliExcluded]);
    const included = new Set(suffixes([...mcpVitest.test.include, ...cliCoreVitest.test.include]));
    return [...excluded].filter((suffix) => cliExcluded.includes(suffix) && included.has(suffix)).sort();
  }

  it('derives .core-spec.ts and .spec.ts as the only test-only suffixes', async () => {
    expect(await testOnlySuffixes()).toEqual(['.core-spec.ts', '.spec.ts']);
  });

  it.each([
    ['a.spec.ts', false],
    ['a.core-spec.ts', false],
    ['a.spec.mts', true],
    ['a.test.ts', true],
    ['testing/x.ts', true],
    ['__fixtures__/x.json', true],
    ['x.json', true],
    ['x.ts', true],
  ])('isCoreFile(%j) is %s, as the configs derive it', async (probe, core) => {
    const testOnly = (await testOnlySuffixes()).some((suffix) => probe.endsWith(suffix));

    expect(isCoreFile(probe)).toBe(core);
    expect(isCoreFile(probe)).toBe(!testOnly);
  });
});
