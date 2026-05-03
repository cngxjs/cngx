import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Per-instance loading slot for `<cngx-chart>`. Project an
 * `<ng-template cngxChartLoading>` to override the default centred
 * spinner with custom markup (skeleton bars, branded loader, custom
 * SVG, etc.). When omitted, the chart renders its built-in spinner.
 *
 * @example
 * ```html
 * <cngx-chart [state]="state()">
 *   <ng-template cngxChartLoading>
 *     <my-branded-spinner />
 *   </ng-template>
 *   <svg:g cngxAxis position="bottom" .../>
 *   ...
 * </cngx-chart>
 * ```
 */
@Directive({
  selector: 'ng-template[cngxChartLoading]',
  standalone: true,
})
export class CngxChartLoading {
  readonly templateRef = inject(TemplateRef<unknown>);
}

/**
 * Per-instance empty slot for `<cngx-chart>`. Project an
 * `<ng-template cngxChartEmpty>` to override the default "No data"
 * fallback. Composes naturally with `<cngx-empty-state>` from
 * `@cngx/ui/empty-state`, illustrations, or any consumer-authored
 * empty surface.
 *
 * @example
 * ```html
 * <cngx-chart [state]="state()">
 *   <ng-template cngxChartEmpty>
 *     <cngx-empty-state title="No telemetry yet" description="Connect a feed to see metrics."/>
 *   </ng-template>
 *   ...
 * </cngx-chart>
 * ```
 */
@Directive({
  selector: 'ng-template[cngxChartEmpty]',
  standalone: true,
})
export class CngxChartEmpty {
  readonly templateRef = inject(TemplateRef<unknown>);
}

/**
 * Per-instance error slot for `<cngx-chart>`. Project an
 * `<ng-template cngxChartError let-error="error">` to override the
 * default error-text fallback. Receives the live state's error object
 * via `let-error` so the template can render a typed message and
 * compose retry actions.
 */
export interface CngxChartErrorContext {
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
