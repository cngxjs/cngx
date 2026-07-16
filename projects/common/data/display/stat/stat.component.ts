import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import { CNGX_STAT, type CngxStatRegistry, type CngxStatSlotKind } from './stat.token';

/** Fixed reading order for the coordinated slots. */
const SLOT_ORDER: readonly CngxStatSlotKind[] = ['label', 'value', 'delta', 'caption'];

/** Structural equality so an unchanged id set never cascades `labelledBy`. */
const idsEqual = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((id, i) => id === b[i]);

/**
 * Coordination molecule for a KPI stat. Its sole reason to exist is the
 * screen-reader layer (Pillar 2): hand-assembling a heading, a `<cngx-metric>`
 * and a `<cngx-delta>` makes a screen reader announce three disconnected
 * fragments. `CngxStat` projects the label / value / delta / caption slots,
 * collects the id each slot registers, and derives one `aria-labelledby` that
 * reads the whole stat as a single accessible name in reading order.
 *
 * Composition, never a config bag (Pillar 3): the molecule owns only the id
 * coordination `computed()` graph; the visuals are whatever atoms the
 * consumer projects into the slots.
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
 * @relatedTo CngxMetric, CngxDelta, CngxTrend
 *
 * <example-url>http://localhost:4200/#/common/data/stat/composed-kpi</example-url>
 */
@Component({
  selector: 'cngx-stat',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: CNGX_STAT, useExisting: CngxStat }],
  host: {
    class: 'cngx-stat',
    role: 'group',
    '[attr.aria-labelledby]': 'labelledBy()',
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
export class CngxStat implements CngxStatRegistry {
  private readonly slots = signal<ReadonlyMap<CngxStatSlotKind, string>>(new Map());

  /**
   * Politeness of the live region. `off` (default) for a static stat;
   * `polite` / `assertive` for a KPI whose value updates in place.
   */
  readonly live = input<'off' | 'polite' | 'assertive'>('off');

  /** {@inheritDoc CngxStatRegistry.register} */
  register(kind: CngxStatSlotKind, id: string): void {
    this.slots.update((prev) => new Map(prev).set(kind, id));
  }

  /** {@inheritDoc CngxStatRegistry.unregister} */
  unregister(kind: CngxStatSlotKind): void {
    this.slots.update((prev) => {
      const next = new Map(prev);
      next.delete(kind);
      return next;
    });
  }

  /** @internal Present slot ids in reading order; structurally stable. */
  protected readonly orderedIds = computed(
    () => {
      const map = this.slots();
      return SLOT_ORDER.map((kind) => map.get(kind)).filter((id): id is string => id !== undefined);
    },
    { equal: idsEqual },
  );

  /** @internal Combined accessible name; `null` when no slot is present. */
  protected readonly labelledBy = computed(() => this.orderedIds().join(' ') || null);
}
