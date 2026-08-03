import { Directive, input, signal, type Signal } from '@angular/core';
import { CNGX_CHART_AXIS, type CngxChartAxis } from './chart-axis';
import { type CngxAxisPosition, type CngxAxisType } from './axis-position';

/**
 * @internal Both reservations of every domain publisher are the same
 * constant, so one frozen node serves all of them rather than two per
 * directive instance.
 */
const NO_RESERVATION: Signal<number> = signal(0).asReadonly();

/**
 * Declares a scale domain to the parent `<cngx-chart>` without drawing
 * anything.
 *
 * A chart builds its `xScale` from whichever projected axis occupies a
 * horizontal edge and its `yScale` from a vertical one. Usually that
 * axis also draws ticks and labels, and `[cngxAxis]` is what you want.
 * Sometimes the domain is all you need: a sparkline has no room for
 * decoration, but its line still has to know that y runs 0 to 100.
 *
 * ```html
 * <cngx-chart [data]="readings()">
 *   <svg:g cngxAxisDomain position="bottom" type="band" [domain]="labels()"></svg:g>
 *   <svg:g cngxAxisDomain position="left" [domain]="[0, 100]"></svg:g>
 *   <svg:g cngxLine></svg:g>
 * </cngx-chart>
 * ```
 *
 * Reserving nothing is the behavioural difference that matters. The
 * chart shrinks its plot area by the room each axis's decoration needs;
 * this one has none, so an 80x24 sparkline keeps all 80x24 for its mark
 * instead of losing a gutter to ticks nobody draws.
 *
 * Attribute-selector on `<svg:g>` for the same reason `[cngxAxis]` is:
 * a `<cngx-axis-domain>` element inside `<svg>` would land in the XHTML
 * namespace. Nothing renders either way, but the host stays a legal SVG
 * child.
 *
 * @category common/chart/axis
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/axis/axis-domain.ts
 * @since 0.1.0
 * @relatedTo CngxAxis, CngxChart, CngxChartAxis
 *
 * <example-url>http://localhost:4200/#/ui/chart-panel/basic/titled-panel-with-legend</example-url>
 * <example-url>http://localhost:4200/#/ui/chart-panel/slots/actions-and-footer</example-url>
 */
@Directive({
  selector: '[cngxAxisDomain]',
  exportAs: 'cngxAxisDomain',
  standalone: true,
  providers: [{ provide: CNGX_CHART_AXIS, useExisting: CngxAxisDomain }],
})
export class CngxAxisDomain implements CngxChartAxis {
  /** Which edge the scale this publishes belongs to. */
  readonly position = input.required<CngxAxisPosition>();
  /** Scale kind the chart builds for this dimension. */
  readonly type = input<CngxAxisType>('linear');
  /** Value range the scale maps from. */
  readonly domain = input<readonly unknown[] | undefined>(undefined);

  /**
   * Always `0`. Not an opt-out from a gutter this directive would
   * otherwise get - it draws nothing, so there is nothing to reserve
   * for, and the number stays derived from what the unit does.
   */
  readonly reservation = NO_RESERVATION;

  /** Always `0`, for the same reason as {@link reservation}. */
  readonly crossReservation = NO_RESERVATION;
}
