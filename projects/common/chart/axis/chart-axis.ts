import { InjectionToken, type Signal } from '@angular/core';
import { type CngxAxisPosition, type CngxAxisType } from './axis-position';

/**
 * What `<cngx-chart>` needs from an axis, and nothing more.
 *
 * Two things travel over this contract. The scale half (`position` /
 * `type` / `domain`) tells the chart which scale to build and over what
 * range of values. The geometry half (`reservation` /
 * `crossReservation`) tells it how much of the box that axis's
 * decoration needs, so the chart can shrink the plot area to fit.
 *
 * Both implementations in the library are axes in the loose sense but
 * differ in what they do: {@link CngxAxis} draws ticks, labels and a
 * title and reserves room for them; `CngxAxisDomain` draws nothing and
 * reserves nothing, existing purely to publish a scale domain. The
 * chart cannot tell them apart, which is the point - it places and
 * sizes against the contract, never against a concrete class.
 *
 * Implement it on your own directive when you need an axis the chart
 * participates with but the library does not ship: a logarithmic scale
 * publisher, an axis whose domain comes from a service, a decoration
 * you draw yourself. Provide it with `useExisting` and the chart picks
 * the directive up through its content query.
 *
 * @category common/chart/axis
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/axis/chart-axis.ts
 * @since 0.1.0
 * @relatedTo CngxAxis, CngxAxisDomain, CngxChart
 */
export interface CngxChartAxis {
  /** Which edge of the plot area this axis occupies. */
  readonly position: Signal<CngxAxisPosition>;
  /** Scale kind the chart builds for this axis's dimension. */
  readonly type: Signal<CngxAxisType>;
  /** Value range the scale maps from. `undefined` yields a NOOP scale. */
  readonly domain: Signal<readonly unknown[] | undefined>;
  /**
   * How far this axis's decoration extends perpendicular to its own
   * line, in viewBox user units. The chart reserves it on the side
   * {@link position} names. Return `0` to claim no room.
   */
  readonly reservation: Signal<number>;
  /**
   * How far this axis's decoration extends *along* its own line, past
   * the plot corner at either end. The chart reserves it on the two
   * sides perpendicular to {@link position}. Return `0` to claim no
   * room.
   */
  readonly crossReservation: Signal<number>;
}

/**
 * Contract token every axis provides and `<cngx-chart>` queries.
 *
 * The chart's content query resolves this rather than a concrete class,
 * so a consumer-authored axis participates in scale building and plot
 * insetting on equal terms with the ones the library ships.
 *
 * @category common/chart/axis
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/axis/chart-axis.ts
 * @since 0.1.0
 * @relatedTo CngxChartAxis, CngxAxis, CngxAxisDomain
 */
export const CNGX_CHART_AXIS = new InjectionToken<CngxChartAxis>('CNGX_CHART_AXIS');
