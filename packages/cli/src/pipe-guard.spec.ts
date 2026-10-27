// Source: the "stdout or stderr closed early" row of the plan's process matrix:
// EPIPE is swallowed, any other stream error is rethrown.
import { EventEmitter } from 'node:events';
import { describe, expect, it } from 'vitest';
import { installPipeGuard } from './pipe-guard.js';

const streamError = (code: string): NodeJS.ErrnoException => Object.assign(new Error(code), { code });

describe('installPipeGuard', () => {
  it('swallows EPIPE', () => {
    const stream = new EventEmitter();
    installPipeGuard(stream);

    expect(() => stream.emit('error', streamError('EPIPE'))).not.toThrow();
  });

  it('rethrows any other stream error', () => {
    const stream = new EventEmitter();
    installPipeGuard(stream);

    expect(() => stream.emit('error', streamError('EIO'))).toThrow('EIO');
  });

  // Mutation: without the guard the EPIPE case must fail, or the spec above proves nothing.
  it('mutation: an unguarded stream throws on EPIPE', () => {
    const stream = new EventEmitter();

    expect(() => stream.emit('error', streamError('EPIPE'))).toThrow('EPIPE');
  });
});
