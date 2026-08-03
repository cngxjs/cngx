import { inject, InjectionToken, type Signal } from '@angular/core';

/**
 * Numeric input shape every concrete scale accepts. Linear scales take
 * `number`, time scales take `Date | number`, band scales take `string`
 * or arbitrary references via {@link createBandScale}'s generic. The
 * union narrows at the layer atom (`[cngxLine]`, `[cngxBar]`, ...);
 * the chart context surface stays scale-agnostic.
 *
 * @category common/chart
 */
export type XScaleInput = number | Date | string;

/**
 * Generic scale function shape. Maps a domain value of type `TIn` to a
 * range value (typically a pixel coordinate). Mirrors the result type
 * of every `create*Scale` factory in `@cngx/common/chart`.
 *
 * @category common/chart
 */
export type ScaleFn<TIn> = (v: TIn) => number;

/**
 * Space reserved inside the viewBox for axis decoration, in viewBox
 * user units. Logical, not physical: `inlineStart` is the left edge in
 * an LTR writing mode. A side with no axis on it reserves `0`.
 *
 * Chart-internal. The context publishes the resulting
 * {@link CngxChartPlotArea} instead, so the rectangle is derived once
 * rather than reconstructed from the box and the inset at every reader.
 *
 * @internal
 */
export interface CngxChartInset {
  readonly inlineStart: number;
  readonly inlineEnd: number;
  readonly blockStart: number;
  readonly blockEnd: number;
}

/**
 * The rectangle the chart's scales map onto: the viewBox minus the
 * space reserved for axis decoration, in viewBox user units. Without
 * axes it equals the box.
 *
 * `x0`/`y0` are the top-left corner, `x1`/`y1` the bottom-right one,
 * and `width`/`height` the extents between them. Every chart child that
 * needs to know where the plot starts reads this rather than
 * subtracting an inset from the box itself - one derivation, so the
 * scales and the axis lines cannot drift apart.
 *
 * A collapsed plot (a box narrower than the room its axes need) reports
 * `width` or `height` at or below `0`. Readers guard on the extent; the
 * chart hands out its NOOP scale in the same case.
 *
 * @category common/chart
 */
export interface CngxChartPlotArea {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Reactive context published by `<cngx-chart>` to its content children.
 * Layer atoms (`[cngxLine]`, `[cngxBar]`, ...) and `[cngxAxis]` inject
 * {@link CNGX_CHART_CONTEXT} to read the parent chart's scales,
 * dimensions, data length, and data array without needing a direct
 * reference to the parent class. Token is non-generic at the DI
 * boundary; layer atoms call `data<T>()` to narrow the array to their
 * own `<T>` - the single boundary cast lives inside `CngxChart`'s
 * `data<U>()` method, not at every consumer site.
 *
 * @category common/chart
 */
export interface CngxChartContext<TX = XScaleInput, TY = number> {
  readonly xScale: Signal<ScaleFn<TX>>;
  readonly yScale: Signal<ScaleFn<TY>>;
  readonly dimensions: Signal<{ width: number; height: number }>;
  /**
   * The plot rectangle inside the viewBox, after the room the projected
   * axes need for their decoration. The chart's own scale ranges and
   * `[cngxAxis]`'s line placement both read this single derivation, so
   * ticks always line up with marks. A chart without axes gets the full
   * box.
   */
  readonly plot: Signal<CngxChartPlotArea>;
  readonly dataLength: Signal<number>;
  /**
   * Generic-aware data accessor. Reads the chart's reactive data
   * array; the consumer's `<T>` parameter narrows the returned type
   * without a per-call cast at the consumer site. The chart performs
   * one boundary cast in its implementation.
   */
  data<T = unknown>(): readonly T[];
  /**
   * SVG-output gate (default `true`). Layer atoms wrap their own
   * `<svg:path>` / `<svg:rect>` / `<svg:circle>` emission behind
   * `@if (ctx.renderSvg())`. The chart shell drives this `false` only
   * when Canvas mode is active - an atom asks "should I render my own
   * SVG?", never "what mode am I in?".
   */
  readonly renderSvg: Signal<boolean>;
}

/**
 * Injection token consumed by every chart child (`[cngxAxis]`, layer
 * atoms, `<cngx-chart-data-table>`). `<cngx-chart>` provides itself
 * via `useExisting`; child queries narrow the generic on the consumer
 * side.
 *
 * @category common/chart
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/chart/chart-context.ts
 * @since 0.1.0
 */
export const CNGX_CHART_CONTEXT = new InjectionToken<CngxChartContext>('CngxChartContext');

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
      `${consumerName}: missing CNGX_CHART_CONTEXT - must be a content child of <cngx-chart>`,
    );
  }
  return ctx;
}
