import { computed, type Signal, type WritableSignal } from '@angular/core';

/**
 * Inputs for {@link createSliderCore}. Every field is a `Signal`, so the
 * derived values track their sources without any manual sync. `value` is
 * the single writable source of truth - the only thing the keyboard and
 * pointer handlers ever mutate. `boundedMin` / `boundedMax` default to
 * `min` / `max`; a dual-thumb host narrows them to the sibling-thumb bound
 * so the cross-clamp math lives here rather than in an effect.
 *
 * @category common/interactive/slider
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/slider/slider-core.ts
 * @since 0.1.0
 */
export interface CngxSliderCoreOptions {
  /** Writable source of truth. The only signal the core ever writes. */
  readonly value: WritableSignal<number>;
  /** Track lower bound. Also the snap-to-step origin. */
  readonly min: Signal<number>;
  /** Track upper bound. */
  readonly max: Signal<number>;
  /** Step granularity. `<= 0` disables snapping (continuous slider). */
  readonly step: Signal<number>;
  /** Effective lower bound (sibling clamp for a range thumb). Defaults to `min`. */
  readonly boundedMin?: Signal<number>;
  /** Effective upper bound (sibling clamp for a range thumb). Defaults to `max`. */
  readonly boundedMax?: Signal<number>;
  /**
   * Maps the current value to an `aria-valuetext` string (currency, dates,
   * t-shirt sizes). When omitted, `aria-valuetext` mirrors the numeric value.
   */
  readonly valueText?: (value: number) => string;
}

/**
 * Derived view + write surface produced by {@link createSliderCore}. All
 * read members are `computed()` from the option signals; all mutation goes
 * through the four imperative helpers, which snap-to-step and clamp before
 * writing. The directive binds `clampedValue` to `aria-valuenow`, `fraction`
 * to its thumb-position CSS var, and `ariaValueText` to `aria-valuetext`.
 *
 * @category common/interactive/slider
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/slider/slider-core.ts
 * @since 0.1.0
 */
export interface CngxSliderCore {
  /** Raw model value (may sit outside the effective bounds until first write). */
  readonly value: Signal<number>;
  /** `value` snapped to step and clamped to the effective bounds - bind to `aria-valuenow`. */
  readonly clampedValue: Signal<number>;
  /** Position along the track in `[0, 1]` - bind to the thumb-position CSS var. */
  readonly fraction: Signal<number>;
  /** `fraction` as a `0..100` percentage. */
  readonly percent: Signal<number>;
  /** `aria-valuetext` string (formatter output or the numeric value). */
  readonly ariaValueText: Signal<string>;
  /** True when the clamped value sits on the effective lower bound. */
  readonly atMin: Signal<boolean>;
  /** True when the clamped value sits on the effective upper bound. */
  readonly atMax: Signal<boolean>;
  /** Snap + clamp `next`, then write it (no-op when unchanged). */
  setValue(next: number): void;
  /** Map a `[0, 1]` track fraction to a value, then {@link setValue} it. */
  setFromFraction(fraction: number): void;
  /** Move by `stepCount` steps from the current value (negative to decrease). */
  stepBy(stepCount: number): void;
  /** Jump to the effective lower bound. */
  stepToMin(): void;
  /** Jump to the effective upper bound. */
  stepToMax(): void;
}

function decimalPlaces(n: number): number {
  if (!Number.isFinite(n)) {
    return 0;
  }
  const text = String(n);
  const dot = text.indexOf('.');
  return dot === -1 ? 0 : text.length - dot - 1;
}

function snapToStep(raw: number, origin: number, step: number): number {
  if (step <= 0 || !Number.isFinite(step)) {
    return raw;
  }
  const steps = Math.round((raw - origin) / step);
  const snapped = origin + steps * step;
  // Float-drift correction: 0.1 * 3 = 0.30000000000000004 otherwise leaks
  // into aria-valuenow. Round to the precision the step itself carries.
  const decimals = Math.max(decimalPlaces(step), decimalPlaces(origin));
  return Number(snapped.toFixed(decimals));
}

function clamp(value: number, lo: number, hi: number): number {
  if (hi < lo) {
    return lo;
  }
  return Math.min(hi, Math.max(lo, value));
}

/**
 * Pure factory for a slider's value derivation - the brain shared by
 * {@link CngxSlider} and each {@link CngxSliderThumb} of a range slider. It
 * owns no DI and no DOM: hand it the source signals, get back the clamped
 * value, the track fraction, the `aria-valuetext` string, and the four
 * mutation helpers the keyboard / pointer handlers call. Snapping and
 * bound-clamping live in {@link CngxSliderCore.setValue}, so every write
 * path stays valid without an effect syncing state (Pillar 1).
 *
 * @category common/interactive/slider
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/slider/slider-core.ts
 * @since 0.1.0
 * @relatedTo CngxSlider, CngxRangeSlider, CngxSliderThumb
 */
export function createSliderCore(options: CngxSliderCoreOptions): CngxSliderCore {
  const { value, min, max, step } = options;
  const boundedMin = options.boundedMin ?? min;
  const boundedMax = options.boundedMax ?? max;

  const clampedValue = computed(() =>
    clamp(snapToStep(value(), min(), step()), boundedMin(), boundedMax()),
  );

  const fraction = computed(() => {
    const lo = min();
    const span = max() - lo;
    if (span <= 0) {
      return 0;
    }
    return clamp((clampedValue() - lo) / span, 0, 1);
  });

  const percent = computed(() => fraction() * 100);

  const ariaValueText = computed(() => {
    const current = clampedValue();
    const format = options.valueText;
    return format ? format(current) : String(current);
  });

  const atMin = computed(() => clampedValue() <= boundedMin());
  const atMax = computed(() => clampedValue() >= boundedMax());

  const setValue = (next: number): void => {
    if (!Number.isFinite(next)) {
      return;
    }
    const resolved = clamp(snapToStep(next, min(), step()), boundedMin(), boundedMax());
    if (resolved !== value()) {
      value.set(resolved);
    }
  };

  return {
    value,
    clampedValue,
    fraction,
    percent,
    ariaValueText,
    atMin,
    atMax,
    setValue,
    setFromFraction: (f) => setValue(min() + clamp(f, 0, 1) * (max() - min())),
    stepBy: (stepCount) => setValue(clampedValue() + stepCount * (step() > 0 ? step() : 1)),
    stepToMin: () => setValue(boundedMin()),
    stepToMax: () => setValue(boundedMax()),
  };
}
