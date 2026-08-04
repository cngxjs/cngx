import { Directive, inject, TemplateRef } from '@angular/core';
import type { CngxChartPlotArea } from './chart-context';

/**
 * Common context shape passed into every chart slot template
 * (loading, empty, error). Carries the chart's current rendered
 * dimensions plus a `small` discriminator so consumers can switch
 * between a compact and a richer fallback in the same template:
 *
 * ```html
 * <ng-template cngxChartEmpty let-small="small">
 *   @if (small) {
 *     <span class="cngx-empty-compact">No data</span>
 *   } @else {
 *     <cngx-empty-state title="No telemetry yet" description="..." />
 *   }
 * </ng-template>
 * ```
 *
 * The `small` flag is true when the chart's rendered width is below
 * the threshold defined by the `--cngx-chart-small-width-px` CSS
 * custom property (read from the chart at first render via the
 * `CHART_SMALL_BREAKPOINT_PX` constant; default 400). Container-size
 * based, not viewport-based, so it works correctly inside dashboard
 * cells of any size.
 *
 * @category common/chart
 */
export interface CngxChartSlotContext {
  readonly width: number;
  readonly height: number;
  readonly small: boolean;
  /**
   * The rectangle the chart's marks occupy: the viewBox minus the room
   * the projected axes reserved for their decoration. Without axes it
   * equals the box.
   *
   * Slot templates paint over the chart, and since the axis gutter
   * landed the box is no longer the drawing surface - a fallback
   * centred on `width`/`height` sits off-centre from the marks it
   * replaces. Align to this instead when the fallback should line up
   * with the plot rather than with the host.
   *
   * In viewBox user units. `width`/`height` above stay the *rendered*
   * host size, so the two are in different spaces whenever an explicit
   * `[width]` chart is squeezed; use the `--cngx-chart-plot-*` custom
   * properties for CSS-side alignment, which are resolution-independent.
   */
  readonly plot: CngxChartPlotArea;
}

/**
 * Threshold (px) below which `CngxChartSlotContext.small` is true.
 * Hardcoded for v1; later releases may make this a config token.
 *
 * @category common/chart
 */
export const CHART_SMALL_BREAKPOINT_PX = 400;

/**
 * Per-instance loading slot for `<cngx-chart>`. Project an
 * `<ng-template cngxChartLoading>` to override the default centred
 * spinner. The template receives a {@link CngxChartSlotContext} with
 * the chart's rendered width/height plus a `small` flag for
 * container-size-aware branching.
 *
 * ```html
 * <cngx-chart [state]="state()">
 *   <ng-template cngxChartLoading let-small="small">
 *     @if (small) { <my-mini-spinner /> }
 *     @else { <my-branded-spinner /> }
 *   </ng-template>
 * </cngx-chart>
 * ```
 *
 * @category common/chart
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/chart/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxChartSlotContext, CngxChartEmpty, CngxChartError, CngxChart
 */
@Directive({
  selector: 'ng-template[cngxChartLoading]',
  standalone: true,
})
export class CngxChartLoading {
  readonly templateRef = inject(TemplateRef<CngxChartSlotContext>);
}

/**
 * Per-instance empty slot for `<cngx-chart>`. Receives a
 * {@link CngxChartSlotContext} so the consumer can branch on chart
 * size - typically a compact text fallback when `small` is true and
 * a richer surface (`<cngx-empty-state>`, illustration, action) at
 * regular sizes.
 *
 * ```html
 * <cngx-chart [state]="state()">
 *   <ng-template cngxChartEmpty let-small="small" let-plot="plot">
 *     <span>No readings in this range ({{ plot.width }} wide)</span>
 *   </ng-template>
 * </cngx-chart>
 * ```
 *
 * @category common/chart
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/chart/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxChartSlotContext, CngxChartLoading, CngxChartError, CngxChart
 */
@Directive({
  selector: 'ng-template[cngxChartEmpty]',
  standalone: true,
})
export class CngxChartEmpty {
  readonly templateRef = inject(TemplateRef<CngxChartSlotContext>);
}

/**
 * Context for the `*cngxChartError` slot template. Extends the
 * common slot context with the live error value via `$implicit` and
 * `error` keys, so consumers can render a typed message AND branch
 * on chart size.
 *
 * @category common/chart
 */
export interface CngxChartErrorContext extends CngxChartSlotContext {
  readonly $implicit: unknown;
  readonly error: unknown;
}

/**
 * `*cngxChartError` slot - overrides the chart-level error placeholder.
 * Receives a {@link CngxChartErrorContext}.
 *
 * ```html
 * <cngx-chart [state]="state()">
 *   <ng-template cngxChartError let-error let-small="small">
 *     <span>Could not load: {{ error?.message }}</span>
 *   </ng-template>
 * </cngx-chart>
 * ```
 *
 * @category common/chart
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/chart/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxChartErrorContext, CngxChartLoading, CngxChartEmpty, CngxChart
 */
@Directive({
  selector: 'ng-template[cngxChartError]',
  standalone: true,
})
export class CngxChartError {
  readonly templateRef = inject(TemplateRef<CngxChartErrorContext>);
}

/**
 * Context for the connection-lifecycle slots (`*cngxChartConnectionError`,
 * `*cngxChartReconnecting`). Extends the common slot context with the live
 * connection error value via `$implicit` / `error`, mirroring
 * {@link CngxChartErrorContext}. The connection channel is separate from
 * the data `[state]` channel, so this context reflects `[connectionState]`.
 *
 * @category common/chart
 */
export interface CngxChartConnectionContext extends CngxChartSlotContext {
  readonly $implicit: unknown;
  readonly error: unknown;
}

/**
 * `*cngxChartConnectionError` slot - overrides the default banner shown
 * when `[connectionState]` reports `'error'` (connection lost). Overlaid on
 * top of the data view with `role="alert"`; receives a
 * {@link CngxChartConnectionContext}.
 *
 * ```html
 * <cngx-chart [connectionState]="socket">
 *   <ng-template cngxChartConnectionError let-error>
 *     <span>Live feed lost: {{ error?.message }}</span>
 *   </ng-template>
 * </cngx-chart>
 * ```
 *
 * @category common/chart
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/chart/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxChartConnectionContext, CngxChartReconnecting, CngxChart
 */
@Directive({
  selector: 'ng-template[cngxChartConnectionError]',
  standalone: true,
})
export class CngxChartConnectionError {
  readonly templateRef = inject(TemplateRef<CngxChartConnectionContext>);
}

/**
 * `*cngxChartReconnecting` slot - overrides the default subtle indicator
 * shown when `[connectionState]` reports `'refreshing'` (reconnecting).
 * Overlaid with `role="status"` (polite); receives a
 * {@link CngxChartConnectionContext}.
 *
 * ```html
 * <cngx-chart [connectionState]="socket">
 *   <ng-template cngxChartReconnecting let-small="small">
 *     <span>{{ small ? 'Reconnecting' : 'Reconnecting to the live feed' }}</span>
 *   </ng-template>
 * </cngx-chart>
 * ```
 *
 * @category common/chart
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/chart/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxChartConnectionContext, CngxChartConnectionError, CngxChart
 */
@Directive({
  selector: 'ng-template[cngxChartReconnecting]',
  standalone: true,
})
export class CngxChartReconnecting {
  readonly templateRef = inject(TemplateRef<CngxChartConnectionContext>);
}

/**
 * `*cngxChartOverlay` slot - projects HTML *on top of the marks*, inside
 * the plot area. Unlike the loading / empty / error slots (which replace
 * the marks in their respective fallback arms), the overlay renders in the
 * `@default` content arm alongside the drawn chart, so it is where
 * crosshair readouts, hover tooltips, annotation callouts and brush
 * affordances belong.
 *
 * The chart positions the overlay frame itself, inset to the plot area via
 * the `--cngx-chart-plot-*` custom properties it already publishes - the
 * consumer performs no `exportAs`, no `plot()` / `dimensions()` arithmetic,
 * and needs no wrapper of their own to act as a containing block. Receives
 * the shared {@link CngxChartSlotContext}, so `plot` / `width` / `height` /
 * `small` are all readable from the template:
 *
 * ```html
 * <cngx-chart [data]="series()" [width]="480" [height]="200">
 *   <svg:g cngxAxis position="left" type="linear" [domain]="[0, 100000]"></svg:g>
 *   <svg:g cngxLine></svg:g>
 *   <ng-template cngxChartOverlay let-plot="plot">
 *     <div class="my-callout">{{ plot.width }}x{{ plot.height }} plot</div>
 *   </ng-template>
 * </cngx-chart>
 * ```
 *
 * Pointer events: the frame is `pointer-events: none`, so it never
 * intercepts a click, hover or drag meant for the marks beneath it. An
 * interactive element inside the overlay opts back in per element with
 * `pointer-events: auto`. The default is off deliberately - an overlay
 * that silently swallows every pointer event on the chart is invisible
 * until some other interaction (a tooltip, a brush) stops firing, and
 * that is a debugging session; opting a single element back in is one
 * declaration.
 *
 * Accessibility: the chart host is `role="img"` with an auto-summary
 * `aria-label`, so assistive technology sees the chart as a single
 * labelled graphic and never traverses into the overlay. Treat overlay
 * content as *visual* - a hover readout, a tint, an annotation callout.
 * Any state that has to reach AT belongs on the reactive summary or the
 * SR data-table (the `aria-describedby` channel the chart already owns),
 * not on an element projected here.
 *
 * @category common/chart
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/chart/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxChartSlotContext, CngxChartLoading, CngxChartEmpty, CngxChartError, CngxChart
 */
@Directive({
  selector: 'ng-template[cngxChartOverlay]',
  standalone: true,
})
export class CngxChartOverlay {
  readonly templateRef = inject(TemplateRef<CngxChartSlotContext>);
}
