import { InjectionToken } from '@angular/core';

/** Attack ramp, seconds — lifts gain from 0 so the oscillator start is click-free. */
const ATTACK_SEC = 0.005;
/** Release ramp, seconds — drops gain to 0 before stop so the end is click-free. */
const RELEASE_SEC = 0.03;
/** A tone shorter than attack+release cannot host both ramps; clamp up to this floor. */
const MIN_DURATION_SEC = ATTACK_SEC + RELEASE_SEC;
/**
 * Default peak gain for a single tone (before the engine's master volume).
 * Exported so a per-element volume multiplier can scale against the same
 * baseline the generator uses.
 * @category common/audio
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/audio/tone-generator/tone-generator.ts
 * @since 0.1.0
 */
export const DEFAULT_TONE_GAIN = 0.2;

/**
 * Per-tone synthesis options.
 * @category common/audio
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/audio/tone-generator/tone-generator.ts
 * @since 0.1.0
 */
export interface ToneOptions {
  /** Oscillator waveform. Default `'sine'`. */
  readonly type?: OscillatorType;
  /** Peak gain in `[0, 1]` before the master volume. Default `0.2`. */
  readonly gain?: number;
  /** Schedule offset in seconds from `currentTime`. Default `0`. */
  readonly when?: number;
}

/**
 * One step of an earcon sequence.
 * @category common/audio
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/audio/tone-generator/tone-generator.ts
 * @since 0.1.0
 */
export interface ToneStep {
  /** Frequency in Hz. */
  readonly freq: number;
  /** Duration in milliseconds. */
  readonly duration: number;
  /** Oscillator waveform for this step. Default `'sine'`. */
  readonly type?: OscillatorType;
  /** Peak gain for this step in `[0, 1]`. Default `0.2`. */
  readonly gain?: number;
  /** Silent gap in milliseconds before this step starts. Default `0`. */
  readonly delay?: number;
}

/**
 * Public handle returned by {@link createToneGenerator}.
 * @category common/audio
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/audio/tone-generator/tone-generator.ts
 * @since 0.1.0
 */
export interface CngxToneGenerator {
  /** Play a single tone of `durationMs` at `freq`. */
  tone(freq: number, durationMs: number, opts?: ToneOptions): void;
  /** Play a sequence of steps back-to-back, each scheduled after the previous. */
  sequence(steps: readonly ToneStep[]): void;
}

/**
 * Dependencies handed to the tone-generator factory by the engine.
 * @category common/audio
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/audio/tone-generator/tone-generator.ts
 * @since 0.1.0
 */
export interface ToneGeneratorDeps {
  /** Lazy getter for the shared context — called per tone so the engine controls resume. */
  readonly context: () => BaseAudioContext;
  /** Node to connect each tone into (typically the engine's master-volume gain). */
  readonly destination: () => AudioNode;
}

/**
 * Signature of the tone-generator factory — the shape an override must match.
 * @category common/audio
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/audio/tone-generator/tone-generator.ts
 * @since 0.1.0
 */
export type CngxAudioToneGeneratorFactory = (deps: ToneGeneratorDeps) => CngxToneGenerator;

/**
 * Pure `OscillatorNode` synthesis — no audio assets. Each tone is an
 * oscillator through a per-note gain envelope (5 ms attack, 30 ms release)
 * into the engine's master-volume node. The envelope is not decoration: a
 * bare `start()`/`stop()` on a full-amplitude oscillator produces an audible
 * click at both ends; ramping in and out removes it.
 *
 * `create*` pure factory (no `inject()`), so it composes inside the engine and
 * runs against the shared `createAudioContextMock` in specs.
 * @category common/audio
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/audio/tone-generator/tone-generator.ts
 * @since 0.1.0
 */
export const createToneGenerator: CngxAudioToneGeneratorFactory = (deps) => {
  function schedule(
    freq: number,
    durationMs: number,
    opts: ToneOptions | undefined,
    whenSec: number,
  ): void {
    const ctx = deps.context();
    const dest = deps.destination();
    const start = ctx.currentTime + whenSec + (opts?.when ?? 0);
    const durSec = Math.max(durationMs / 1000, MIN_DURATION_SEC);
    const peak = opts?.gain ?? DEFAULT_TONE_GAIN;

    const osc = ctx.createOscillator();
    osc.type = opts?.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, start);

    const env = ctx.createGain();
    const holdStart = start + ATTACK_SEC;
    const releaseStart = start + durSec - RELEASE_SEC;
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(peak, holdStart);
    env.gain.setValueAtTime(peak, releaseStart);
    env.gain.linearRampToValueAtTime(0, start + durSec);

    osc.connect(env);
    env.connect(dest);
    osc.start(start);
    osc.stop(start + durSec);
    osc.onended = () => {
      osc.disconnect();
      env.disconnect();
    };
  }

  return {
    tone(freq, durationMs, opts) {
      schedule(freq, durationMs, opts, 0);
    },
    sequence(steps) {
      let offsetSec = 0;
      for (const step of steps) {
        offsetSec += (step.delay ?? 0) / 1000;
        schedule(step.freq, step.duration, { type: step.type, gain: step.gain }, offsetSec);
        offsetSec += Math.max(step.duration / 1000, MIN_DURATION_SEC);
      }
    },
  };
};

/**
 * Swappable tone-generator factory. Defaults to {@link createToneGenerator}
 * (oscillator synthesis). Override to swap in sample-based playback without
 * forking the engine — the documented second consumer of this boundary token.
 *
 * @relatedTo createToneGenerator, CNGX_AUDIO_ENGINE_FACTORY
 * @category common/audio
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/audio/tone-generator/tone-generator.ts
 * @since 0.1.0
 */
export const CNGX_AUDIO_TONE_GENERATOR_FACTORY = new InjectionToken<CngxAudioToneGeneratorFactory>(
  'CngxAudioToneGeneratorFactory',
  { providedIn: 'root', factory: () => createToneGenerator },
);
