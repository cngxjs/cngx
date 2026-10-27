// Source: the "node packages/cli/dist/index.js" and "stdout closed early" rows of
// the plan's process matrix. Runs the built entry the way a shell does, so it
// needs `npm run build:cli` first (dist/ and the bundled data/).
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
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
});
