import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import {
  createLatencyProbe,
  injectLoadingConfig,
  resolveLoadingTreatment,
  type CngxAsyncState,
  type CngxLoadingTreatment,
} from '@cngx/core/utils';

import { injectChartPanelConfig } from './config/inject-chart-panel-config';
import { CNGX_CHART_PANEL, type CngxChartPanelRegistry } from './chart-panel.token';

/**
 * Where the projected legend sits relative to the chart body.
 *
 * @category ui/chart-panel
 * @since 0.1.0
 */
export type CngxChartPanelLegendPosition = 'top' | 'bottom' | 'none';

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
    '[attr.aria-busy]': 'panelBusy() || null',
    '[attr.data-legend]': 'legendPosition()',
    '[class.cngx-chart-panel--busy]': 'panelBusy()',
  },
  template: `
    <header class="cngx-chart-panel__header">
      <div class="cngx-chart-panel__heading">
        <ng-content select="[cngxChartPanelTitle]" />
        <ng-content select="[cngxChartPanelSubtitle]" />
      </div>

      <!-- Dimmed and aria-disabled while a panel-level operation runs, so a
           second range change is not invited into an in-flight one. The cluster
           stays in the DOM and in the a11y tree; only the state flips (Pillar
           2). Deliberately not inert: that would hide the actions from AT
           entirely and the aria-disabled would never be announced. -->
      <div
        class="cngx-chart-panel__action-slot"
        [attr.aria-disabled]="panelBusy() || null"
      >
        <ng-content select="[cngxChartPanelActions]" />
      </div>
    </header>

    <!-- One legend outlet, placed by the CSS order property. A duplicated
         ng-content selector would leave the second outlet permanently empty,
         and the legend carries no focusable content, so visual reordering
         cannot desync from tab order. -->
    <div class="cngx-chart-panel__legend">
      <ng-content select="cngx-chart-legend" />
    </div>

    <div class="cngx-chart-panel__body">
      <!-- No view switch here by design: the projected cngx-chart owns the data
           async envelope. The placeholder below shows only when nothing has
           been projected yet, so the two never contend. -->
      <ng-content />

      @if (showPlaceholder()) {
        @if (resolvedTreatment() === 'skeleton') {
          <div class="cngx-chart-panel__placeholder" aria-hidden="true"></div>
        } @else {
          <div class="cngx-chart-panel__placeholder cngx-chart-panel__placeholder--spinner">
            <span class="cngx-chart-panel__spinner" aria-hidden="true"></span>
          </div>
        }
      }
    </div>

    <ng-content select="[cngxChartPanelFooter]" />
  `,
  styleUrls: ['./chart-panel.component.css'],
})
export class CngxChartPanel implements CngxChartPanelRegistry {
  private readonly titleId = signal<string | undefined>(undefined);
  private readonly config = injectChartPanelConfig();
  private readonly loadingConfig = injectLoadingConfig();

  /**
   * Panel-level async envelope - the one driving the header chrome, not the
   * chart's data. Bind the chart's own `[state]` to the chart; bind a
   * range-switch or export operation here. Optional per the bridge-input rule.
   */
  readonly state = input<
    CngxAsyncState<unknown> | undefined,
    CngxAsyncState<unknown> | '' | undefined
  >(undefined, { transform: (v) => (typeof v === 'string' ? undefined : v) });

  /** Where the projected `cngx-chart-legend` sits. `'none'` hides it. */
  readonly legendPosition = input<CngxChartPanelLegendPosition>(
    this.config.legendPosition ?? 'bottom',
  );

  /**
   * What the panel-level placeholder renders while it waits. Only reaches the
   * screen before a chart has been projected; once one is, the chart owns the
   * body.
   */
  readonly loadingTreatment = input<CngxLoadingTreatment>(this.config.loadingTreatment ?? 'auto');

  /**
   * Whether a chart body has been projected. `false` only in the window before
   * a consumer's `@if` resolves, which is exactly when a panel-level
   * placeholder is the honest thing to show.
   */
  readonly hasBody = input<boolean>(true);

  /** @internal Panel-level busy, never the chart's data-loading state. */
  protected readonly panelBusy = computed(() => this.state()?.isBusy() ?? false);

  private readonly probe = createLatencyProbe(() => this.panelBusy());

  /** @internal Spinner or skeleton for the panel placeholder. */
  protected readonly resolvedTreatment = computed(() =>
    resolveLoadingTreatment(
      this.loadingTreatment(),
      this.probe.lastDuration(),
      this.loadingConfig.spinnerVsSkeletonCutoff,
    ),
  );

  /**
   * @internal The placeholder is strictly a pre-chart affordance. Once a body
   * is projected it never shows again, so the panel can never paint over the
   * chart's own skeleton / empty / error views.
   */
  protected readonly showPlaceholder = computed(() => !this.hasBody() && this.panelBusy());

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
