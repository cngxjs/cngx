import {
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  HostAttributeToken,
  inject,
} from '@angular/core';
import { nextUid } from '@cngx/core/utils';

import { CNGX_CHART_PANEL } from './chart-panel.token';

// aria-disabled is allowed on controls and on explicit widget / group roles,
// not on a generic wrapper.
const CONTROL_SELECTOR = 'a[href], button, input, select, textarea, [role]';

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
 * On a control (a native button, link or form field, or any element with an
 * explicit `role`) the marker also puts that state on the control itself:
 * `aria-disabled="true"` plus an `aria-describedby` to the panel's busy reason
 * ("Updating" by default, `ariaLabels.busy`), both only while the panel is
 * busy, so focusing the action announces why it is unavailable. A static
 * `aria-disabled` / `aria-describedby` the consumer wrote on the element is
 * kept and merged. On a plain wrapper element the marker adds nothing (the
 * attribute is not allowed on a generic); the slot group carries the state.
 * Activation stays blocked by the slot (pointer and Enter/Space), so the
 * control keeps its focusability instead of turning natively `disabled`.
 *
 * @category ui/chart-panel
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/chart-panel/chart-panel-slots.ts
 * @since 0.1.0
 * @relatedTo CngxChartPanel
 */
@Directive({
  selector: '[cngxChartPanelActions]',
  standalone: true,
  host: {
    class: 'cngx-chart-panel__actions',
    '[attr.aria-disabled]': 'ariaDisabled()',
    '[attr.aria-describedby]': 'describedBy()',
  },
})
export class CngxChartPanelActions {
  private readonly panel = inject(CNGX_CHART_PANEL, { optional: true });
  private readonly ownDisabled = inject(new HostAttributeToken('aria-disabled'), {
    optional: true,
  });
  private readonly ownDescribedBy = inject(new HostAttributeToken('aria-describedby'), {
    optional: true,
  });
  private readonly carriesState =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.matches(CONTROL_SELECTOR);
  private readonly busy = computed(() => this.carriesState && (this.panel?.busy() ?? false));

  /** @internal The panel busy state on the control, else the consumer's own value. */
  protected readonly ariaDisabled = computed(() => (this.busy() ? 'true' : this.ownDisabled));

  /**
   * @internal The busy reason, referenced only while busy (the node itself is
   * always rendered), appended to the consumer's own description.
   */
  protected readonly describedBy = computed(() => {
    if (!this.busy() || !this.panel) {
      return this.ownDescribedBy;
    }
    return [this.ownDescribedBy, this.panel.busyDescriptionId].filter(Boolean).join(' ');
  });
}

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
