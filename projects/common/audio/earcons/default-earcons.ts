import type { ToneStep } from '../tone-generator/tone-generator';

/** A named earcon — an ordered sequence of tone steps. */
export interface EarconConfig {
  /** The tones that make up the earcon, played back-to-back. */
  readonly sequence: readonly ToneStep[];
}

/**
 * The six built-in earcons, synthesised entirely from `OscillatorNode` — zero
 * audio assets. Plain `as const` (mirrors `CNGX_SELECT_GLYPHS`): tree-shakeable,
 * compile-time exhaustive keys, and NOT exported from `public-api.ts`. The
 * consumer override surface is `withEarcons({...})` and the engine's runtime
 * `register()`, never this const.
 *
 * @internal
 */
export const CNGX_AUDIO_DEFAULT_EARCONS = {
  /** Neutral tick for taps, toggles, and generic acknowledgements. */
  tap: { sequence: [{ freq: 660, duration: 30 }] },
  /** Rising two-note chime for a completed positive action. */
  success: {
    sequence: [
      { freq: 660, duration: 80 },
      { freq: 880, duration: 120 },
    ],
  },
  /** Falling sawtooth pair for a failure — deliberately harsher. */
  error: {
    sequence: [
      { freq: 400, duration: 100, type: 'sawtooth', gain: 0.15 },
      { freq: 300, duration: 160, type: 'sawtooth', gain: 0.15 },
    ],
  },
  /** Two soft triangle pulses for a caution state. */
  warning: {
    sequence: [
      { freq: 520, duration: 90, type: 'triangle' },
      { freq: 520, duration: 90, type: 'triangle', delay: 60 },
    ],
  },
  /** Gentle upward two-note for an incoming notification. */
  notification: {
    sequence: [
      { freq: 780, duration: 70 },
      { freq: 990, duration: 90, delay: 20 },
    ],
  },
  /** Three-note upward arpeggio for a finished multi-step flow. */
  complete: {
    sequence: [
      { freq: 523, duration: 90 },
      { freq: 659, duration: 90 },
      { freq: 784, duration: 140 },
    ],
  },
} as const satisfies Record<string, EarconConfig>;

/** Union of the built-in earcon names. @internal */
export type CngxDefaultEarconName = keyof typeof CNGX_AUDIO_DEFAULT_EARCONS;
