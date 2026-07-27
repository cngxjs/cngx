import { computed, Directive, signal } from '@angular/core';

import type { CngxStatRegistry, CngxStatSlotKind } from './stat.token';

/** Fixed reading order for the coordinated slots. */
const SLOT_ORDER: readonly CngxStatSlotKind[] = ['label', 'value', 'delta', 'caption'];

/** Structural equality so an unchanged id set never cascades `labelledBy`. */
const idsEqual = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((id, i) => id === b[i]);

/** Structural equality so an unchanged slot set never cascades to a placeholder. */
const kindsEqual = (a: readonly CngxStatSlotKind[], b: readonly CngxStatSlotKind[]): boolean =>
  a.length === b.length && a.every((kind, i) => kind === b[i]);

/**
 * The slot-id coordination brain behind {@link CNGX_STAT}. Collects the id each
 * `cngxStat*` slot registers and derives one `aria-labelledby` that reads the
 * whole stat as a single accessible name in reading order.
 *
 * Lives as a host directive rather than inside `CngxStat` because the slot
 * directives resolve `CNGX_STAT` against their **declaration** site: content
 * written inside an organism never reaches a `<cngx-stat>` that sits in that
 * organism's own template. Any component that wants to host the four slots
 * therefore applies this brain and re-points the token at it:
 *
 * ```ts
 * hostDirectives: [CngxStatCoordinator],
 * providers: [{ provide: CNGX_STAT, useExisting: CngxStatCoordinator }],
 * ```
 *
 * Same shape as `CngxPaginate` behind `CNGX_PAGINATOR_HOST`, which
 * `CngxPaginator` and `CngxIncrementalList` share the same way.
 *
 * @category common/data/metric
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/data/display/stat/stat-coordinator.directive.ts
 * @since 0.1.0
 * @relatedTo CngxStat, CNGX_STAT
 */
@Directive({
  standalone: true,
})
export class CngxStatCoordinator implements CngxStatRegistry {
  private readonly slots = signal<ReadonlyMap<CngxStatSlotKind, string>>(new Map());

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

  /** Present slot ids in reading order; structurally stable. */
  readonly orderedIds = computed(
    () => {
      const map = this.slots();
      return SLOT_ORDER.map((kind) => map.get(kind)).filter((id): id is string => id !== undefined);
    },
    { equal: idsEqual },
  );

  /** Combined accessible name for the host; `null` when no slot is present. */
  readonly labelledBy = computed(() => this.orderedIds().join(' ') || null);

  /**
   * Which slots a consumer actually projected, in reading order. Registration
   * happens when the slot directive is constructed in the consumer's template,
   * so this stays accurate even while the host renders a branch that does not
   * include the `<ng-content>` outlets - which is what lets a placeholder mirror
   * the real tile instead of guessing at it.
   */
  readonly presentKinds = computed(
    () => {
      const map = this.slots();
      return SLOT_ORDER.filter((kind) => map.has(kind));
    },
    { equal: kindsEqual },
  );
}
