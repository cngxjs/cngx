import { Directive, inject, TemplateRef } from '@angular/core';

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
 * @relatedTo CngxChartEmpty, CngxChartError, CngxChart
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
 * @category common/chart
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/chart/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxChartLoading, CngxChartError, CngxChart
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
 * @category common/chart
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/chart/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxChartLoading, CngxChartEmpty, CngxChart
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
 * @category common/chart
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/chart/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxChartReconnecting, CngxChart
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
 * @category common/chart
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/chart/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxChartConnectionError, CngxChart
 */
@Directive({
  selector: 'ng-template[cngxChartReconnecting]',
  standalone: true,
})
export class CngxChartReconnecting {
  readonly templateRef = inject(TemplateRef<CngxChartConnectionContext>);
}
