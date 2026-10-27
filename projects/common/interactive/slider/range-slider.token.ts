import { inject, InjectionToken, type Signal } from '@angular/core';
import { CngxRuntimeError } from '@cngx/utils';

/** Which end of a range slider a {@link CngxSliderThumb} drives. */
export type CngxSliderThumbPosition = 'start' | 'end';

/** Effective, sibling-clamped bounds a single thumb may move within. */
export interface CngxSliderThumbBounds {
  /** Lower bound: the track min for the start thumb, the start value for the end thumb. */
  readonly min: Signal<number>;
  /** Upper bound: the end value for the start thumb, the track max for the end thumb. */
  readonly max: Signal<number>;
}

/**
 * Contract a {@link CngxRangeSlider} provides so each {@link CngxSliderThumb}
 * can read the shared track config, learn its sibling-clamped bounds, and
 * write its end of the tuple - all without injecting the concrete parent
 * class (which would create a cyclic type and block Atomic Decompose). The
 * cross-clamp lives in {@link boundsFor}, so two thumbs can never pass each
 * other and no effect is needed to keep them ordered.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/slider/range-slider.token.ts
 * @since 0.1.0
 * @relatedTo CngxRangeSlider, CngxSliderThumb
 */
export interface CngxSliderRangeHost {
  /** Track lower bound. */
  readonly min: Signal<number>;
  /** Track upper bound. */
  readonly max: Signal<number>;
  /** Step granularity shared by both thumbs. */
  readonly step: Signal<number>;
  /** Page-key jump size shared by both thumbs (absolute). Undefined = derive from range. */
  readonly largeStep: Signal<number | undefined>;
  /** Whether the whole range slider is disabled. */
  readonly disabled: Signal<boolean>;
  /** Track axis shared by both thumbs. */
  readonly orientation: Signal<'horizontal' | 'vertical'>;
  /** Current `[start, end]` tuple - the single source of truth. */
  readonly value: Signal<readonly [number, number]>;
  /** Optional `aria-valuetext` formatter shared across both thumbs. */
  readonly valueText: Signal<((value: number) => string) | undefined>;
  /** Sibling-clamped bounds for one thumb, preventing thumb-cross. */
  boundsFor(position: CngxSliderThumbPosition): CngxSliderThumbBounds;
  /** Write one end of the tuple (the thumb's core has already snapped + clamped). */
  commit(position: CngxSliderThumbPosition, value: number): void;
  /**
   * Map a pointer position to a `0..1` fraction along the shared track, using
   * the range host's own geometry. A thumb cannot measure this itself - its
   * element is the tiny handle, not the full track - so the host owns the math.
   */
  fractionFromPointer(clientX: number, clientY: number): number;
}

/**
 * DI token for the {@link CngxSliderRangeHost} contract. {@link CngxRangeSlider}
 * provides it via `useExisting`; each {@link CngxSliderThumb} injects it up the
 * element-injector hierarchy.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/slider/range-slider.token.ts
 * @since 0.1.0
 * @relatedTo CngxRangeSlider, CngxSliderThumb
 */
export const CNGX_SLIDER_RANGE = new InjectionToken<CngxSliderRangeHost>('CNGX_SLIDER_RANGE');

/**
 * Inject the {@link CNGX_SLIDER_RANGE} of the surrounding range track from a
 * {@link CngxSliderThumb}. Throws a `CngxRuntimeError` with code `CNGX1062`
 * when no range track is above it, in development and production alike.
 *
 * @internal
 */
export function injectSliderRange(): CngxSliderRangeHost {
  const range = inject(CNGX_SLIDER_RANGE, { optional: true });
  if (!range) {
    throw new CngxRuntimeError(
      'CNGX1062',
      typeof ngDevMode !== 'undefined' &&
        ngDevMode &&
        '[cngxSliderThumb] must be placed inside an element with [cngxRangeSliderTrack], such as <cngx-range-slider>.',
    );
  }
  return range;
}
