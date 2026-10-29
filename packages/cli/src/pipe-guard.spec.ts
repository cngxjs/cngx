// Source: the "stdout or stderr closed early" row of the plan's process matrix:
// EPIPE is swallowed; any other stream error is one `cngx: internal error:` line on
// stderr and exit 3, never a throw and never a stack trace.
import { EventEmitter } from 'node:events';
import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import type { PipeGuardDeps } from './pipe-guard.js';
import { installPipeGuard } from './pipe-guard.js';

const streamError = (code: string): NodeJS.ErrnoException => Object.assign(new Error(`${code}: stream failed`), { code });

function recorder(): PipeGuardDeps & { lines: string[]; codes: number[] } {
  const lines: string[] = [];
  const codes: number[] = [];
  return { lines, codes, stderr: (text) => lines.push(text), setExitCode: (code) => codes.push(code) };
}

describe('installPipeGuard', () => {
  it('swallows EPIPE without a line or an exit code', () => {
    const stream = new EventEmitter();
    const deps = recorder();
    installPipeGuard(stream, deps);

    expect(() => stream.emit('error', streamError('EPIPE'))).not.toThrow();
    expect(deps.lines).toEqual([]);
    expect(deps.codes).toEqual([]);
  });

  it('reports any other stream error as one stderr line and exit 3, without throwing', () => {
    const stream = new EventEmitter();
    const deps = recorder();
    installPipeGuard(stream, deps);

    expect(() => stream.emit('error', streamError('EIO'))).not.toThrow();
    expect(deps.lines).toEqual(['cngx: internal error: EIO: stream failed\n']);
    expect(deps.codes).toEqual([3]);
  });

  it('still sets exit 3 when the stderr write itself throws', () => {
    const stream = new EventEmitter();
    const codes: number[] = [];
    installPipeGuard(stream, {
      stderr: () => {
        throw new Error('stderr is gone');
      },
      setExitCode: (code) => codes.push(code),
    });

    expect(() => stream.emit('error', streamError('EIO'))).not.toThrow();
    expect(codes).toEqual([3]);
  });

  it('reports a real Writable failing with ENOSPC once', async () => {
    const stream = new Writable({
      write: (_chunk, _encoding, callback) => callback(streamError('ENOSPC')),
    });
    const deps = recorder();
    installPipeGuard(stream, deps);

    stream.write('a');
    stream.write('b');
    await new Promise((resolve) => setImmediate(resolve));

    expect(deps.lines).toEqual(['cngx: internal error: ENOSPC: stream failed\n']);
    expect(deps.codes).toEqual([3]);
  });
});
