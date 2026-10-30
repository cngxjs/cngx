import { Directive, booleanAttribute, effect, input, linkedSignal, untracked } from '@angular/core';
import { cngxDevWarn } from '@cngx/utils';

import { createDebouncer } from '../debouncer/debouncer';
import { injectCngxAudio } from '../inject-audio';

/** Throttle key - the pitch directive plays a single ad-hoc voice. */
const PITCH_VOICE = 'pitch';

/** No span to interpolate across: equal ends, or an end that is `NaN` / infinite. */
function isDegenerateDomain(lo: number, hi: number): boolean {
  return lo === hi || !Number.isFinite(lo) || !Number.isFinite(hi);
}

/**
 * Pitch-mode audio binder. Sonifies a continuous numeric value: each change of
 * `[cngxAudioPitch]` clamps against a fixed domain, linear-scales into an output
 * frequency range, and plays a short tone. Useful for sliders, gauges, and live
 * metrics - the ear tracks a value without looking.
 *
 * ```html
 * <input type="range" min="0" max="100"
 *   [cngxAudioPitch]="volume()"
 *   [pitchDomain]="[0, 100]"
 *   [pitchRange]="[220, 880]" />
 * ```
 *
 * The inputs are discrete rather than an options record so `[cngxAudioPitch]`
 * stays a native reactive input - passing `[cngxAudioPitch]="volume()"` binds a
 * signal value directly, never a `Signal` smuggled inside a config object. The
 * domain is caller-supplied and fixed; it is never accumulated from observed
 * values, so the directive holds no hidden state. Value-to-frequency is a pure
 * derivation; rapid sweeps are throttled through the shared `createDebouncer`.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/audio/pitch-mode/audio-pitch.directive.ts
 * @since 0.1.0
 * @relatedTo CngxAudio, injectCngxAudio
 * <example-url>/#/common/audio/pitch/slider</example-url>
 * @axis level atom
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

  /**
   * Fixed input domain `[lo, hi]` the value is clamped against; `lo > hi`
   * inverts the mapping. An empty domain (`lo === hi`) or one with a `NaN` /
   * infinite end plays the range low for every value and warns in dev mode
   * (CNGX1069).
   */
  readonly pitchDomain = input.required<[number, number]>();

  /** Tone duration in ms. Default `120`. */
  readonly pitchDurationMs = input<number>(120);

  /** Minimum ms between tones during a sweep. Default `50`. */
  readonly pitchThrottleMs = input<number>(50);

  /** Per-element volume multiplier in `[0, 1]`; unset uses the tone default. */
  readonly audioVolume = input<number | undefined>(undefined);

  /** Suppress this element's audio without unbinding. */
  readonly audioDisabled = input(false, { transform: booleanAttribute });

  // One instance for the directive's lifetime, deliberately outside the signal
  // graph: a debouncer carries mutable throttle state, and minting one inside a
  // computed would hand out a fresh object per evaluation. The window is a
  // getter, so a changed [pitchThrottleMs] applies on the next fire.
  private readonly debouncer = createDebouncer({ windowMs: () => this.pitchThrottleMs() });

  // Fires on change, never on mount: sonifying the initial value would emit a
  // tone the user never asked for, and would burn the throttle window before
  // their first move. Same current/previous shape as createTransitionTracker.
  private readonly transition = linkedSignal<number, { current: number; previous: number | null }>({
    source: () => this.value(),
    computation: (current, prev) => ({ current, previous: prev?.value.current ?? null }),
    equal: (a, b) => a.current === b.current && a.previous === b.previous,
  });

  constructor() {
    effect(() => {
      const { current, previous } = this.transition();
      if (previous === null || current === previous) {
        return;
      }
      untracked(() => {
        if (this.audioDisabled()) {
          return;
        }
        if (!this.debouncer.shouldFire(PITCH_VOICE)) {
          return;
        }
        this.audio.tone(this.scale(current), this.pitchDurationMs(), undefined, this.audioVolume());
      });
    });

    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      // [pitchDomain] is a live input, so the check re-runs on every change;
      // the key keeps a re-bound identical empty tuple silent.
      let lastWarned: string | null = null;
      effect(() => {
        const [lo, hi] = this.pitchDomain();
        if (!isDegenerateDomain(lo, hi)) {
          lastWarned = null;
          return;
        }
        const key = `${lo},${hi}`;
        if (key === lastWarned) {
          return;
        }
        lastWarned = key;
        const rangeLo = untracked(() => this.pitchRange()[0]);
        cngxDevWarn(
          'CNGX1069',
          `[cngxAudioPitch] [pitchDomain] [${lo}, ${hi}] is empty or not finite; every value plays ${rangeLo} Hz, the low end of [pitchRange].`,
        );
      });
    }
  }

  /**
   * Clamp to the domain, then linear-scale into the frequency range. The
   * interpolation runs against the declared pair, so an inverted domain maps
   * `lo` to the range low and `hi` to the range high.
   */
  private scale(value: number): number {
    const [domainLo, domainHi] = this.pitchDomain();
    const [rangeLo, rangeHi] = this.pitchRange();
    if (isDegenerateDomain(domainLo, domainHi)) {
      return rangeLo;
    }
    const min = Math.min(domainLo, domainHi);
    const max = Math.max(domainLo, domainHi);
    const clamped = Math.max(min, Math.min(max, value));
    const t = (clamped - domainLo) / (domainHi - domainLo);
    return rangeLo + t * (rangeHi - rangeLo);
  }
}
