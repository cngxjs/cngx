import { DestroyRef, Directive, inject } from '@angular/core';
import { nextUid } from '@cngx/core/utils';

import { CNGX_CHART_PANEL } from './chart-panel.token';

/**
 * Marks the panel's title. Its generated id becomes the panel's
 * `aria-labelledby`, so the whole region reads as one named group instead of
 * an unlabelled box wrapped around a chart.
 *
 * Registration runs against {@link CNGX_CHART_PANEL}, which the panel provides -
 * the title resolves it from its declaration site in the consumer template.
 *
 * @category ui/chart-panel
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/chart-panel/chart-panel-slots.ts
 * @since 0.1.0
 * @relatedTo CngxChartPanel, CngxChartPanelSubtitle
 */
@Directive({
  selector: '[cngxChartPanelTitle]',
  standalone: true,
  host: { class: 'cngx-chart-panel__title', '[id]': 'id' },
})
export class CngxChartPanelTitle {
  /** Auto-generated id bound to the host `[id]`; consumed by the panel. */
  readonly id = nextUid('cngx-chart-panel-title');

  constructor() {
    const panel = inject(CNGX_CHART_PANEL, { optional: true });
    panel?.registerTitle(this.id);
    // Without the withdrawal the panel's aria-labelledby would keep pointing at
    // a removed element - a dangling reference reads as an unnamed group to AT.
    inject(DestroyRef).onDestroy(() => panel?.unregisterTitle(this.id));
  }
}

/**
 * Marks the panel's secondary line under the title - a period, a unit, a
 * comparison basis. Descriptive only; it does not join the accessible name.
 *
 * @category ui/chart-panel
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/chart-panel/chart-panel-slots.ts
 * @since 0.1.0
 * @relatedTo CngxChartPanel, CngxChartPanelTitle
 */
@Directive({
  selector: '[cngxChartPanelSubtitle]',
  standalone: true,
  host: { class: 'cngx-chart-panel__subtitle' },
})
export class CngxChartPanelSubtitle {}

/**
 * Marks the panel's header action cluster - a range picker, a refresh button,
 * an overflow menu. The panel dims the cluster and marks it `aria-disabled`
 * while a panel-level operation runs, so a user cannot fire a second range
 * change into an in-flight one.
 *
 * @category ui/chart-panel
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/chart-panel/chart-panel-slots.ts
 * @since 0.1.0
 * @relatedTo CngxChartPanel
 */
@Directive({
  selector: '[cngxChartPanelActions]',
  standalone: true,
  host: { class: 'cngx-chart-panel__actions' },
})
export class CngxChartPanelActions {}

/**
 * Marks the panel's footer row - a source note, a last-updated timestamp, a
 * drill-down link. Sits below the chart body and the legend.
 *
 * @category ui/chart-panel
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/chart-panel/chart-panel-slots.ts
 * @since 0.1.0
 * @relatedTo CngxChartPanel
 */
@Directive({
  selector: '[cngxChartPanelFooter]',
  standalone: true,
  host: { class: 'cngx-chart-panel__footer' },
})
export class CngxChartPanelFooter {}
