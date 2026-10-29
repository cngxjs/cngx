// Source: the "node packages/cli/dist/index.js" and "stdout closed early" rows of
// the plan's process matrix. Runs the built entry the way a shell does, so it
// needs `npm run build:cli` first (dist/ and the bundled data/).
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assertNoAnsi } from './output-guards.js';

const ENTRY = fileURLToPath(new URL('../dist/index.js', import.meta.url));
const DATA = fileURLToPath(new URL('../data/documentation.json', import.meta.url));
// The default size of a Linux pipe buffer; output above it cannot be fully
// written before the reader goes away.
const PIPE_BUFFER = 65536;
const BIG = ['list', '--format=json'];

const run = (...args: string[]) => spawnSync(process.execPath, [ENTRY, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

describe('the built entry', () => {
  beforeAll(() => {
    if (!existsSync(ENTRY) || !existsSync(DATA)) {
      throw new Error('packages/cli/dist or data is missing; run `npm run build:cli` before `npm run test:cli`.');
    }
  });

  it('answers a query with exit 0 and plain output', () => {
    const result = run('api', 'CngxSelect');

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('# CngxSelect');
    expect(result.stderr).toBe('');
    assertNoAnsi(result.stdout);
  });

  it('prints the version and exits 0', () => {
    const result = run('--version');

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^\d+\.\d+\.\d+\S*\n$/);
  });

  it('exits 1 for an unknown symbol and 2 for an unknown flag', () => {
    expect(run('api', 'NoSuchThing').status).toBe(1);
    expect(run('api', '--bogus').status).toBe(2);
  });

  it('survives a reader that closes before the output is written', async () => {
    const full = run(...BIG);
    expect(full.status).toBe(0);
    // Precondition: the output overflows a pipe buffer, so a closed reader is
    // what `cngx list | head -1` really produces, not a write that fits.
    expect(Buffer.byteLength(full.stdout)).toBeGreaterThan(PIPE_BUFFER);

    // Closing the read end right after spawn, before the child has loaded the
    // snapshot, makes its write fail with EPIPE every time. Waiting for a first
    // chunk instead races the parent's 64 KiB reads against the pipe buffer, and
    // an unguarded entry then passes whenever both together absorb the output.
    const child = spawn(process.execPath, [ENTRY, ...BIG], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.setEncoding('utf8').on('data', (chunk: string) => (stderr += chunk));
    child.stdout.destroy();

    const code = await new Promise<number | null>((resolve) => child.on('close', (exit) => resolve(exit)));

    expect(stderr).toBe('');
    expect(code).toBe(0);
  });

  describe('a stdout that fails with ENOSPC', () => {
    // The failure is injected by a --import preload written here, so no test hook
    // ever lives in src or dist.
    const hookDir = mkdtempSync(join(tmpdir(), 'cngx-cli-enospc-'));
    const hook = join(hookDir, 'enospc-stdout.mjs');
    writeFileSync(
      hook,
      "process.stdout._write = (_chunk, _encoding, callback) => callback(Object.assign(new Error('ENOSPC: no space left on device, write'), { code: 'ENOSPC' }));\n",
    );
    afterAll(() => rmSync(hookDir, { recursive: true, force: true }));

    it('exits 3 with one stderr line and no stack trace', () => {
      const result = spawnSync(process.execPath, ['--import', hook, ENTRY, 'api', 'CngxSelect'], { encoding: 'utf8' });

      expect(result.status).toBe(3);
      expect(result.stderr).toBe('cngx: internal error: ENOSPC: no space left on device, write\n');
    });
  });

  it.each(['--help', '-h'])('prints help on stdout and exits 0 for %s', (flag) => {
    const result = run(flag);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Usage: cngx <command>');
    expect(result.stderr).toBe('');
  });

  it('prints help on stderr and exits 2 when run bare', () => {
    const result = run();

    expect(result.status).toBe(2);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('Usage: cngx <command>');
  });

  it('exits 2 with a usage line for an unknown global flag', () => {
    const result = run('--bogus');

    expect(result.status).toBe(2);
    expect(result.stdout).toBe('');
    expect(result.stderr).toMatch(/^cngx: Unknown option '--bogus'/);
  });

  // No test hook goes into dist: these cases copy the entry and its two early
  // modules into a temp dir and replace one module there.
  describe('the bootstrap branches of a copied entry', () => {
    const roots: string[] = [];
    afterAll(() => roots.forEach((root) => rmSync(root, { recursive: true, force: true })));

    function copiedEntry(replace: Record<string, string>): string {
      const root = mkdtempSync(join(tmpdir(), 'cngx-cli-entry-'));
      roots.push(root);
      const dist = join(root, 'dist');
      mkdirSync(dist);
      for (const file of ['index.js', 'pipe-guard.js', 'node-floor.js']) {
        copyFileSync(join(dirname(ENTRY), file), join(dist, file));
      }
      for (const [file, source] of Object.entries(replace)) {
        writeFileSync(join(dist, file), source);
      }
      return join(dist, 'index.js');
    }

    const throwingAdapter = { 'cli-adapter.js': "throw new Error('adapter failed to load');\n" };

    it('exits 3 with one stderr line when the adapter fails to load', () => {
      const result = spawnSync(process.execPath, [copiedEntry(throwingAdapter), 'api', 'CngxSelect'], { encoding: 'utf8' });

      expect(result.status).toBe(3);
      expect(result.stdout).toBe('');
      expect(result.stderr).toBe('cngx: internal error: adapter failed to load\n');
    });

    it.each([['--format', 'json'], ['--format=json']])('prints one json failure document under %s', (...format) => {
      const result = spawnSync(process.execPath, [copiedEntry(throwingAdapter), 'api', 'CngxSelect', ...format], { encoding: 'utf8' });

      expect(result.status).toBe(3);
      expect(result.stderr).toBe('cngx: internal error: adapter failed to load\n');
      expect(JSON.parse(result.stdout)).toEqual({
        cngxVersion: null,
        result: null,
        error: { reason: 'internal', message: 'adapter failed to load' },
      });
    });

    it('exits 2 with the floor message when the node floor check fails', () => {
      const floor = { 'node-floor.js': "export const checkNodeFloor = () => 'cngx: Node 99 or newer is required (running test).';\n" };
      const result = spawnSync(process.execPath, [copiedEntry(floor), 'api', 'CngxSelect'], { encoding: 'utf8' });

      expect(result.status).toBe(2);
      expect(result.stdout).toBe('');
      expect(result.stderr).toBe('cngx: Node 99 or newer is required (running test).\n');
    });
  });
});
