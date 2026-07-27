import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import { CNGX_CHART_PANEL, type CngxChartPanelRegistry } from './chart-panel.token';

/**
 * Dashboard housing for a chart: a titled, footer-capable region that frames
 * whatever `cngx-chart` or preset the consumer projects into it.
 *
 * **What it deliberately does not do.** `cngx-chart` already owns the data-level
 * async envelope - its own `[state]`, its skeleton / empty / error slots, its
 * SR data table. The panel never duplicates that machine. Reproducing it here
 * would put two managers on one state (Pillar 1) and turn the panel into a
 * God-component (Pillar 3). The chart stays the authority on what the body
 * shows; the panel only frames it.
 *
 * What the panel does own is the chrome a bare chart cannot express: a title
 * that names the region for assistive tech, a subtitle, a header action
 * cluster, and a footer. `role="group"` plus `aria-labelledby` pointing at the
 * projected title means a screen reader announces "Revenue by quarter, group"
 * instead of dropping the user into an unlabelled SVG (Pillar 2).
 *
 * ```html
 * <cngx-chart-panel>
 *   <h3 cngxChartPanelTitle>Revenue by quarter</h3>
 *   <span cngxChartPanelSubtitle>EUR, net</span>
 *   <button cngxChartPanelActions type="button">Refresh</button>
 *
 *   <cngx-chart [data]="series" [state]="revenue">
 *     <svg:g cngxLine [data]="series"></svg:g>
 *   </cngx-chart>
 *
 *   <small cngxChartPanelFooter>Source: finance warehouse</small>
 * </cngx-chart-panel>
 * ```
 *
 * @category ui/chart-panel
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/chart-panel/chart-panel.component.ts
 * @since 0.1.0
 * @relatedTo CngxChart, CngxChartLegend, CngxChartPanelTitle, CngxChartPanelActions
 */
@Component({
  selector: 'cngx-chart-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: CNGX_CHART_PANEL, useExisting: CngxChartPanel }],
  host: {
    class: 'cngx-chart-panel',
    role: 'group',
    '[attr.aria-labelledby]': 'labelledBy()',
  },
  template: `
    <header class="cngx-chart-panel__header">
      <div class="cngx-chart-panel__heading">
        <ng-content select="[cngxChartPanelTitle]" />
        <ng-content select="[cngxChartPanelSubtitle]" />
      </div>
      <ng-content select="[cngxChartPanelActions]" />
    </header>

    <div class="cngx-chart-panel__body">
      <ng-content />
    </div>

    <ng-content select="[cngxChartPanelFooter]" />
  `,
  styleUrls: ['./chart-panel.component.css'],
})
export class CngxChartPanel implements CngxChartPanelRegistry {
  private readonly titleId = signal<string | undefined>(undefined);

  /** {@inheritDoc CngxChartPanelRegistry.registerTitle} */
  registerTitle(id: string): void {
    this.titleId.set(id);
  }

  /** {@inheritDoc CngxChartPanelRegistry.unregisterTitle} */
  unregisterTitle(id: string): void {
    this.titleId.update((current) => (current === id ? undefined : current));
  }

  /**
   * @internal Accessible name of the region, from the projected title slot.
   * `null` when no title was projected - an unnamed group is better than one
   * pointing at an id that does not exist.
   */
  protected readonly labelledBy = computed(() => this.titleId() ?? null);
}
