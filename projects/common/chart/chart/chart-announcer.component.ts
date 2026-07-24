import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { CNGX_CHART_I18N } from '../i18n/chart-i18n';
import { type CngxChart } from './chart.component';

/**
 * Companion live-region announcer for `<cngx-chart>`. Mount it next to a
 * chart and bind the chart instance; it voices the chart's
 * `significantChange()` events to assistive technology through two
 * always-in-DOM regions with a severity split (W3C ARIA practice):
 *
 * - trend flips -> a polite `role="status"` region (informational);
 * - threshold crossings -> an assertive `role="alert"` region
 *   (operationally significant, warrants interruption).
 *
 * Both announcements are pure-derivation `computed`s the template
 * interpolates - there is no `effect()` bridge and nothing to wrap in
 * `untracked()` (same shape as `CngxRecyclerAnnouncer`). Text is localised
 * through {@link CNGX_CHART_I18N}.
 *
 * ```html
 * <cngx-chart #c [data]="points()" />
 * <cngx-chart-announcer [cngxChartAnnouncer]="c" />
 * ```
 *
 * @category common/chart
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/chart/chart-announcer.component.ts
 * @since 0.1.0
 * @relatedTo CngxChart, createSignificantChangeTracker
 *
 * <example-url>http://localhost:4200/#/common/chart/realtime/streaming-telemetry</example-url>
 */
@Component({
  selector: 'cngx-chart-announcer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <span role="status" aria-live="polite" aria-atomic="true" class="cngx-sr-only">{{
      politeAnnouncement()
    }}</span>
    <span role="alert" aria-live="assertive" aria-atomic="true" class="cngx-sr-only">{{
      assertiveAnnouncement()
    }}</span>
  `,
})
export class CngxChartAnnouncer {
  /** The chart instance whose `significantChange()` this announcer voices. */
  readonly chart = input.required<CngxChart>({ alias: 'cngxChartAnnouncer' });

  private readonly i18n = inject(CNGX_CHART_I18N);

  /** Polite (informational) text for trend flips; empty otherwise. */
  protected readonly politeAnnouncement = computed(() => {
    const ev = this.chart().significantChange();
    return ev?.kind === 'trend-flip' ? this.i18n.trendChanged(ev.to) : '';
  });

  /** Assertive (interrupting) text for threshold crossings; empty otherwise. */
  protected readonly assertiveAnnouncement = computed(() => {
    const ev = this.chart().significantChange();
    return ev?.kind === 'threshold-cross' ? this.i18n.thresholdAlert(ev.threshold) : '';
  });
}
