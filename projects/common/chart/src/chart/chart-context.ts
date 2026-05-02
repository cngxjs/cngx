import { InjectionToken, type Signal } from '@angular/core';

/**
 * Numeric input shape every concrete scale accepts. Linear scales take
 * `number`, time scales take `Date | number`, band scales take `string`
 * or arbitrary references via {@link createBandScale}'s generic. The
 * union narrows at the layer atom (`<cngx-line>`, `<cngx-bar>`, ...);
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
 * Layer atoms (`<cngx-line>`, `<cngx-bar>`, ...) and `<cngx-axis>`
 * inject {@link CNGX_CHART_CONTEXT} to read the parent chart's scales,
 * dimensions, and data length without needing a direct reference to
 * the parent class. Token is non-generic at the DI boundary; consumers
 * narrow `<TX, TY>` on injection.
 *
 * The chart's data array is intentionally NOT on the context — layer
 * atoms read it from the chart via a separate generic-aware accessor
 * the chart component provides as a host-bound member.
 */
export interface CngxChartContext<TX = XScaleInput, TY = number> {
  readonly xScale: Signal<ScaleFn<TX>>;
  readonly yScale: Signal<ScaleFn<TY>>;
  readonly dimensions: Signal<{ width: number; height: number }>;
  readonly dataLength: Signal<number>;
}

/**
 * Injection token consumed by every chart child (`<cngx-axis>`, layer
 * atoms, `<cngx-chart-data-table>`). `<cngx-chart>` provides itself
 * via `useExisting`; child queries narrow the generic on the consumer
 * side.
 */
export const CNGX_CHART_CONTEXT = new InjectionToken<CngxChartContext>(
  'CngxChartContext',
);
