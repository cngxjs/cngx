import { createAudioContextMock } from '@cngx/testing';
import { describe, expect, it } from 'vitest';

// Characterization of the shared @cngx/testing Web Audio mock. Co-located
// under the common target (projects/testing has no test runner); the mock is
// otherwise exercised by tone-generator.spec.ts.
describe('createAudioContextMock', () => {
  it('starts suspended by default and exposes a zero clock', () => {
    const ctx = createAudioContextMock();
    expect(ctx.state).toBe('suspended');
    expect(ctx.currentTime).toBe(0);
  });

  it('accepts an initial state', () => {
    expect(createAudioContextMock('running').state).toBe('running');
  });

  it('hands out a fresh oscillator per createOscillator and records them', () => {
    const ctx = createAudioContextMock();
    const a = ctx.createOscillator();
    const b = ctx.createOscillator();
    expect(a).not.toBe(b);
    expect(ctx.oscillators).toEqual([a, b]);
  });

  it('records oscillator start/stop times', () => {
    const ctx = createAudioContextMock();
    const osc = ctx.createOscillator();
    osc.start(0.5);
    osc.stop(1.5);
    expect(osc.startedAt).toBe(0.5);
    expect(osc.stoppedAt).toBe(1.5);
    expect(osc.start).toHaveBeenCalledWith(0.5);
    expect(osc.stop).toHaveBeenCalledWith(1.5);
  });

  it('hands out gain nodes with an assertable gain param', () => {
    const ctx = createAudioContextMock();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, 0);
    expect(ctx.gains).toEqual([gain]);
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.3, 0);
  });

  it('resume flips state to running', async () => {
    const ctx = createAudioContextMock();
    await ctx.resume();
    expect(ctx.state).toBe('running');
  });

  it('suspend and close transition state', async () => {
    const ctx = createAudioContextMock('running');
    await ctx.suspend();
    expect(ctx.state).toBe('suspended');
    await ctx.close();
    expect(ctx.state).toBe('closed');
  });

  it('advanceTime moves the clock forward', () => {
    const ctx = createAudioContextMock();
    ctx.advanceTime(2);
    ctx.advanceTime(0.5);
    expect(ctx.currentTime).toBe(2.5);
  });
});
