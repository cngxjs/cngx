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
 */
export interface CngxChartSlotContext {
  readonly width: number;
  readonly height: number;
  readonly small: boolean;
}

/**
 * Threshold (px) below which `CngxChartSlotContext.small` is true.
 * Hardcoded for v1; later releases may make this a config token.
 */
export const CHART_SMALL_BREAKPOINT_PX = 400;

/**
 * Per-instance loading slot for `<cngx-chart>`. Project an
 * `<ng-template cngxChartLoading>` to override the default centred
 * spinner. The template receives a {@link CngxChartSlotContext} with
 * the chart's rendered width/height plus a `small` flag for
 * container-size-aware branching.
 *
 * @example
 * ```html
 * <cngx-chart [state]="state()">
 *   <ng-template cngxChartLoading let-small="small">
 *     @if (small) { <my-mini-spinner /> }
 *     @else { <my-branded-spinner /> }
 *   </ng-template>
 * </cngx-chart>
 * ```
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
 * size — typically a compact text fallback when `small` is true and
 * a richer surface (`<cngx-empty-state>`, illustration, action) at
 * regular sizes.
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
 */
export interface CngxChartErrorContext extends CngxChartSlotContext {
  readonly $implicit: unknown;
  readonly error: unknown;
}

@Directive({
  selector: 'ng-template[cngxChartError]',
  standalone: true,
})
export class CngxChartError {
  readonly templateRef = inject(TemplateRef<CngxChartErrorContext>);
}

/**
 * Per-instance actions slot for `<cngx-chart>`. Project an
 * `<ng-template cngxChartActions>` to mount controls (fullscreen
 * button, refresh, settings, ...) in the chart's top-right corner.
 * The slot renders on top of the SVG content and remains visible in
 * every state (loading / empty / error / content), so a "retry" or
 * "open fullscreen" affordance is always reachable.
 *
 * Receives the standard {@link CngxChartSlotContext} so consumers can
 * branch on chart size — e.g. show a fullscreen button only when the
 * chart is squeezed below the breakpoint:
 *
 * @example
 * ```html
 * <cngx-chart [data]="data">
 *   <ng-template cngxChartActions let-small="small">
 *     @if (small) {
 *       <button (click)="openFullscreen()" aria-label="Vollbild">⛶</button>
 *     }
 *   </ng-template>
 *   ...
 * </cngx-chart>
 * ```
 *
 * The chart positions the slot absolutely; theming via
 * `--cngx-chart-actions-top` / `--cngx-chart-actions-right`.
 */
@Directive({
  selector: 'ng-template[cngxChartActions]',
  standalone: true,
})
export class CngxChartActions {
  readonly templateRef = inject(TemplateRef<CngxChartSlotContext>);
}
