import { type AudioContextMock, createAudioContextMock } from '@cngx/testing';
import { describe, expect, it } from 'vitest';
import { createToneGenerator } from './tone-generator';

function setup(ctx: AudioContextMock = createAudioContextMock('running')) {
  const gen = createToneGenerator({
    context: () => ctx as unknown as AudioContext,
    destination: () => ctx.destination as unknown as AudioNode,
  });
  return { ctx, gen };
}

describe('createToneGenerator', () => {
  it('creates one oscillator per tone and sets its frequency', () => {
    const { ctx, gen } = setup();
    gen.tone(440, 100);
    expect(ctx.oscillators).toHaveLength(1);
    expect(ctx.oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(
      440,
      expect.any(Number),
    );
  });

  it('applies the requested waveform type', () => {
    const { ctx, gen } = setup();
    gen.tone(440, 100, { type: 'square' });
    expect(ctx.oscillators[0].type).toBe('square');
  });

  it('connects oscillator -> gain -> destination', () => {
    const { ctx, gen } = setup();
    gen.tone(440, 100);
    const osc = ctx.oscillators[0];
    const gain = ctx.gains[0];
    expect(osc.connect).toHaveBeenCalledWith(gain);
    expect(gain.connect).toHaveBeenCalledWith(ctx.destination);
  });

  it('starts and stops the oscillator, stop after start', () => {
    const ctx = createAudioContextMock('running');
    ctx.currentTime = 10;
    const { gen } = setup(ctx);
    gen.tone(440, 100);
    const osc = ctx.oscillators[0];
    expect(osc.startedAt).toBe(10);
    // 100 ms duration -> stop 0.1 s after start.
    expect(osc.stoppedAt).toBeCloseTo(10.1, 5);
  });

  it('ramps the gain envelope up then down (no click artefacts)', () => {
    const { ctx, gen } = setup();
    gen.tone(440, 100, { gain: 0.5 });
    const env = ctx.gains[0];
    // Attack: 0 -> peak; release: -> 0. Two linear ramps.
    expect(env.gain.setValueAtTime).toHaveBeenCalledWith(0, expect.any(Number));
    expect(env.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.5, expect.any(Number));
    expect(env.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, expect.any(Number));
  });

  it('clamps a sub-minimum duration so both ramps fit', () => {
    const ctx = createAudioContextMock('running');
    ctx.currentTime = 0;
    const { gen } = setup(ctx);
    gen.tone(440, 1); // 1 ms -> clamped to attack+release floor (35 ms)
    const osc = ctx.oscillators[0];
    expect(osc.stoppedAt!).toBeCloseTo(0.035, 5);
  });

  it('schedules a sequence back-to-back with cumulative offsets', () => {
    const ctx = createAudioContextMock('running');
    ctx.currentTime = 0;
    const { gen } = setup(ctx);
    gen.sequence([
      { freq: 440, duration: 100 },
      { freq: 660, duration: 100 },
    ]);
    expect(ctx.oscillators).toHaveLength(2);
    const [first, second] = ctx.oscillators;
    expect(first.startedAt).toBe(0);
    // Second starts after the first's clamped/actual duration (0.1 s).
    expect(second.startedAt).toBeCloseTo(0.1, 5);
  });

  it('honours per-step delay in a sequence', () => {
    const ctx = createAudioContextMock('running');
    ctx.currentTime = 0;
    const { gen } = setup(ctx);
    gen.sequence([
      { freq: 440, duration: 100 },
      { freq: 660, duration: 100, delay: 50 },
    ]);
    const [, second] = ctx.oscillators;
    // First 0.1 s + 0.05 s delay = 0.15 s.
    expect(second.startedAt).toBeCloseTo(0.15, 5);
  });

  it('disconnects nodes on oscillator ended', () => {
    const { ctx, gen } = setup();
    gen.tone(440, 100);
    const osc = ctx.oscillators[0];
    const env = ctx.gains[0];
    osc.onended?.();
    expect(osc.disconnect).toHaveBeenCalled();
    expect(env.disconnect).toHaveBeenCalled();
  });
});
