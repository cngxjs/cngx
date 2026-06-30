/**
 * Tick stops from `min` to `max` stepping by `step`, for rendering tick marks +
 * labels. Returns `[]` when the step grid is invalid or denser than `maxCount`
 * (a guard against pathological DOM, e.g. step 1 over a 0..10000 range).
 *
 * @category common/interactive/slider
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/slider/slider-ticks.ts
 * @since 0.1.0
 */
import { computed, type Signal } from '@angular/core';
import { arrayEqual } from '@cngx/utils';

/** Tick view produced by {@link createSliderTicks}. */
export interface CngxSliderTicksView {
  /** Tick spacing as a track percentage string (e.g. `"5%"`), or `null` when marks are off. */
  readonly interval: Signal<string | null>;
  /** Numeric tick stops for labels (empty when labels are off or the grid is too dense). */
  readonly values: Signal<number[]>;
  /** Track fraction `[0, 1]` of a tick value, for positioning its label. */
  fractionOf(value: number): number;
}

/**
 * Derives a slider's tick marks + labels from its bounds, shared by
 * {@link CngxSlider} and {@link CngxRangeSlider} so the math lives once. `marks`
 * gates the repeating-gradient interval; `labels` gates the numeric stops; both
 * are independent. The values signal is `arrayEqual`-guarded.
 *
 * @category common/interactive/slider
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/slider/slider-ticks.ts
 * @since 0.1.0
 */
export function createSliderTicks(options: {
  readonly min: Signal<number>;
  readonly max: Signal<number>;
  readonly step: Signal<number>;
  readonly marks: Signal<boolean>;
  readonly labels: Signal<boolean>;
}): CngxSliderTicksView {
  const { min, max, step, marks, labels } = options;

  const interval = computed<string | null>(() => {
    if (!marks()) {
      return null;
    }
    const span = max() - min();
    if (span <= 0 || step() <= 0) {
      return null;
    }
    return `${(step() / span) * 100}%`;
  });

  const values = computed<number[]>(
    () => (labels() ? sliderTickValues(min(), max(), step()) : []),
    { equal: arrayEqual },
  );

  return {
    interval,
    values,
    fractionOf: (value) => {
      const span = max() - min();
      return span > 0 ? (value - min()) / span : 0;
    },
  };
}

export function sliderTickValues(min: number, max: number, step: number, maxCount = 21): number[] {
  const span = max - min;
  if (step <= 0 || span <= 0) {
    return [];
  }
  const count = Math.floor(span / step);
  if (count + 1 > maxCount) {
    return [];
  }
  const decimals = decimalPlaces(step);
  const stops: number[] = [];
  for (let i = 0; i <= count; i++) {
    stops.push(Number((min + i * step).toFixed(decimals)));
  }
  return stops;
}

function decimalPlaces(n: number): number {
  if (!Number.isFinite(n)) {
    return 0;
  }
  const text = String(n);
  const dot = text.indexOf('.');
  return dot === -1 ? 0 : text.length - dot - 1;
}
