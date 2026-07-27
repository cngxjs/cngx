import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { CngxStatCoordinator } from './stat-coordinator.directive';
import { CNGX_STAT } from './stat.token';

/**
 * Coordination molecule for a KPI stat. Its sole reason to exist is the
 * screen-reader layer (Pillar 2): hand-assembling a heading, a `<cngx-metric>`
 * and a `<cngx-delta>` makes a screen reader announce three disconnected
 * fragments. `CngxStat` projects the label / value / delta / caption slots,
 * collects the id each slot registers, and derives one `aria-labelledby` that
 * reads the whole stat as a single accessible name in reading order.
 *
 * Composition, never a config bag (Pillar 3): the id coordination lives in the
 * {@link CngxStatCoordinator} host directive, so another component that hosts
 * the same four slots applies the identical brain instead of reimplementing it.
 * The visuals stay whatever atoms the consumer projects into the slots.
 *
 * ```html
 * <cngx-stat aria-live="polite">
 *   <span cngxStatLabel>Revenue</span>
 *   <cngx-metric cngxStatValue [value]="1.2" unit="M EUR" />
 *   <cngx-delta cngxStatDelta [value]="5.3" />
 *   <span cngxStatCaption>vs. last quarter</span>
 * </cngx-stat>
 * ```
 *
 * @category common/data/metric
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/data/display/stat/stat.component.ts
 * @since 0.1.0
 * @relatedTo CngxMetric, CngxDelta, CngxTrend, CngxStatCoordinator
 *
 * <example-url>http://localhost:4200/#/common/data/stat/composed-kpi</example-url>
 */
@Component({
  selector: 'cngx-stat',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [CngxStatCoordinator],
  providers: [{ provide: CNGX_STAT, useExisting: CngxStatCoordinator }],
  host: {
    class: 'cngx-stat',
    role: 'group',
    '[attr.aria-labelledby]': 'coordinator.labelledBy()',
    '[attr.aria-live]': 'live()',
  },
  template: `
    <ng-content select="[cngxStatLabel]" />
    <div class="cngx-stat__row">
      <ng-content select="[cngxStatValue]" />
      <ng-content select="[cngxStatDelta]" />
    </div>
    <ng-content select="[cngxStatCaption]" />
  `,
  styleUrls: ['./stat.component.css'],
})
export class CngxStat {
  /** @internal The shared slot-id brain, applied as a host directive. */
  protected readonly coordinator = inject(CngxStatCoordinator, { host: true });

  /**
   * Politeness of the live region. `off` (default) for a static stat;
   * `polite` / `assertive` for a KPI whose value updates in place.
   */
  readonly live = input<'off' | 'polite' | 'assertive'>('off');
}
