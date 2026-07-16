import { DestroyRef, Directive, inject } from '@angular/core';
import { nextUid } from '@cngx/core/utils';

import { CNGX_STAT, type CngxStatSlotKind } from './stat.token';

/**
 * Generate a stable id, register it with the enclosing `CngxStat` (if any),
 * and withdraw it on destroy. Shared by the four slot directives via plain
 * composition - no base class, no inheritance (Pillar 3).
 */
function useStatSlot(kind: CngxStatSlotKind): string {
  const registry = inject(CNGX_STAT, { optional: true });
  const id = nextUid(`cngx-stat-${kind}`);
  registry?.register(kind, id);
  inject(DestroyRef).onDestroy(() => registry?.unregister(kind));
  return id;
}

/**
 * Marks the label element of a {@link CngxStat}. Its generated id leads the
 * molecule's `aria-labelledby`.
 *
 * @category common/data/metric
 * @since 0.1.0
 * @relatedTo CngxStat
 */
@Directive({
  selector: '[cngxStatLabel]',
  standalone: true,
  host: { '[id]': 'id' },
})
export class CngxStatLabel {
  /** Auto-generated id bound to the host `[id]`; consumed by `CngxStat`. */
  readonly id = useStatSlot('label');
}

/**
 * Marks the primary value element of a {@link CngxStat} (typically a
 * `<cngx-metric>`).
 *
 * @category common/data/metric
 * @since 0.1.0
 * @relatedTo CngxStat
 */
@Directive({
  selector: '[cngxStatValue]',
  standalone: true,
  host: { '[id]': 'id' },
})
export class CngxStatValue {
  /** Auto-generated id bound to the host `[id]`; consumed by `CngxStat`. */
  readonly id = useStatSlot('value');
}

/**
 * Marks the delta element of a {@link CngxStat} (typically a `<cngx-delta>`
 * or `<cngx-trend>`).
 *
 * @category common/data/metric
 * @since 0.1.0
 * @relatedTo CngxStat
 */
@Directive({
  selector: '[cngxStatDelta]',
  standalone: true,
  host: { '[id]': 'id' },
})
export class CngxStatDelta {
  /** Auto-generated id bound to the host `[id]`; consumed by `CngxStat`. */
  readonly id = useStatSlot('delta');
}

/**
 * Marks the caption element of a {@link CngxStat} - the trailing context
 * line (e.g. "vs. last quarter").
 *
 * @category common/data/metric
 * @since 0.1.0
 * @relatedTo CngxStat
 */
@Directive({
  selector: '[cngxStatCaption]',
  standalone: true,
  host: { '[id]': 'id' },
})
export class CngxStatCaption {
  /** Auto-generated id bound to the host `[id]`; consumed by `CngxStat`. */
  readonly id = useStatSlot('caption');
}
