import { Directive, computed, effect, input, untracked } from '@angular/core';

import { createDebouncer } from '../debouncer/debouncer';
import { injectCngxAudio } from '../inject-audio';
import { DEFAULT_TONE_GAIN } from '../tone-generator/tone-generator';

/** Throttle key — the pitch directive plays a single ad-hoc voice. */
const PITCH_VOICE = 'pitch';

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Pitch-mode audio binder. Sonifies a continuous numeric value: each change of
 * `[cngxAudioPitch]` clamps against a fixed domain, linear-scales into an output
 * frequency range, and plays a short tone. Useful for sliders, gauges, and live
 * metrics — the ear tracks a value without looking.
 *
 * ```html
 * <input type="range" min="0" max="100"
 *   [cngxAudioPitch]="volume()"
 *   [pitchDomain]="[0, 100]"
 *   [pitchRange]="[220, 880]" />
 * ```
 *
 * The inputs are discrete rather than an options record so `[cngxAudioPitch]`
 * stays a native reactive input — passing `[cngxAudioPitch]="volume()"` binds a
 * signal value directly, never a `Signal` smuggled inside a config object. The
 * domain is caller-supplied and fixed; it is never accumulated from observed
 * values, so the directive holds no hidden state. Value-to-frequency is a pure
 * derivation; rapid sweeps are throttled through the shared `createDebouncer`.
 *
 * @category common/audio
 * @docsKind primary
 * @relatedTo CngxAudio, injectCngxAudio
 */
@Directive({
  selector: '[cngxAudioPitch]',
  exportAs: 'cngxAudioPitch',
})
export class CngxAudioPitch {
  private readonly audio = injectCngxAudio();

  /** The tracked value to sonify. */
  readonly value = input.required<number>({ alias: 'cngxAudioPitch' });

  /** Output frequency range `[lo, hi]` in Hz. Default `[220, 880]`. */
  readonly pitchRange = input<[number, number]>([220, 880]);

  /** Fixed input domain `[min, max]` the value is clamped against. */
  readonly pitchDomain = input.required<[number, number]>();

  /** Tone duration in ms. Default `120`. */
  readonly pitchDurationMs = input<number>(120);

  /** Minimum ms between tones during a sweep. Default `50`. */
  readonly pitchThrottleMs = input<number>(50);

  /** Per-element volume multiplier in `[0, 1]`; unset uses the tone default. */
  readonly audioVolume = input<number | undefined>(undefined);

  /** Suppress this element's audio without unbinding. */
  readonly audioDisabled = input<boolean>(false);

  // Derived from the input rather than cached in a field: a changed
  // [pitchThrottleMs] must rebuild the debouncer (a new window starts a fresh
  // throttle) instead of staying frozen at whatever the first fire captured.
  private readonly debouncer = computed(() =>
    createDebouncer({ windowMs: this.pitchThrottleMs() }),
  );

  constructor() {
    effect(() => {
      const value = this.value();
      untracked(() => {
        if (this.audioDisabled()) {
          return;
        }
        if (!this.debouncer().shouldFire(PITCH_VOICE)) {
          return;
        }
        const volume = this.audioVolume();
        const opts =
          volume === undefined ? undefined : { gain: DEFAULT_TONE_GAIN * clampUnit(volume) };
        this.audio.tone(this.scale(value), this.pitchDurationMs(), opts);
      });
    });
  }

  /** Clamp to the domain, then linear-scale into the frequency range. */
  private scale(value: number): number {
    const [domainLo, domainHi] = this.pitchDomain();
    const [rangeLo, rangeHi] = this.pitchRange();
    const clamped = Math.max(domainLo, Math.min(domainHi, value));
    if (domainHi === domainLo) {
      return rangeLo;
    }
    const t = (clamped - domainLo) / (domainHi - domainLo);
    return rangeLo + t * (rangeHi - rangeLo);
  }
}
