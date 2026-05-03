import { inject, InjectionToken, type Signal } from '@angular/core';

/**
 * Numeric input shape every concrete scale accepts. Linear scales take
 * `number`, time scales take `Date | number`, band scales take `string`
 * or arbitrary references via {@link createBandScale}'s generic. The
 * union narrows at the layer atom (`[cngxLine]`, `[cngxBar]`, ...);
 * the chart context surface stays scale-agnostic.
 */
export type XScaleInput = number | Date | string;

/**
 * Generic scale function shape. Maps a domain value of type `TIn` to a
 * range value (typically a pixel coordinate). Mirrors the result type
 * of every `create*Scale` factory in `@cngx/common/chart`.
 */
export type ScaleFn<TIn> = (v: TIn) => number;

/**
 * Reactive context published by `<cngx-chart>` to its content children.
 * Layer atoms (`[cngxLine]`, `[cngxBar]`, ...) and `[cngxAxis]` inject
 * {@link CNGX_CHART_CONTEXT} to read the parent chart's scales,
 * dimensions, data length, and data array without needing a direct
 * reference to the parent class. Token is non-generic at the DI
 * boundary; layer atoms call `data<T>()` to narrow the array to their
 * own `<T>` — the single boundary cast lives inside `CngxChart`'s
 * `data<U>()` method, not at every consumer site.
 */
export interface CngxChartContext<TX = XScaleInput, TY = number> {
  readonly xScale: Signal<ScaleFn<TX>>;
  readonly yScale: Signal<ScaleFn<TY>>;
  readonly dimensions: Signal<{ width: number; height: number }>;
  readonly dataLength: Signal<number>;
  /**
   * Generic-aware data accessor. Reads the chart's reactive data
   * array; the consumer's `<T>` parameter narrows the returned type
   * without a per-call cast at the consumer site. The chart performs
   * one boundary cast in its implementation.
   */
  data<T = unknown>(): readonly T[];
}

/**
 * Injection token consumed by every chart child (`[cngxAxis]`, layer
 * atoms, `<cngx-chart-data-table>`). `<cngx-chart>` provides itself
 * via `useExisting`; child queries narrow the generic on the consumer
 * side.
 */
export const CNGX_CHART_CONTEXT = new InjectionToken<CngxChartContext>(
  'CngxChartContext',
);

/**
 * Inject the parent chart's reactive context. Throws a clear dev-mode
 * error when the consumer is not mounted as a content child of
 * `<cngx-chart>`. The `consumerName` argument is interpolated into the
 * error message so the consumer-class name surfaces at the call site
 * rather than a generic guard string.
 *
 * Replaces six verbatim copies of the same six-line helper that
 * previously lived inline in every layer atom.
 */
export function injectChartContext(consumerName: string): CngxChartContext {
  const ctx = inject(CNGX_CHART_CONTEXT, { optional: true });
  if (!ctx) {
    throw new Error(
      `${consumerName}: missing CNGX_CHART_CONTEXT — must be a content child of <cngx-chart>`,
    );
  }
  return ctx;
}
