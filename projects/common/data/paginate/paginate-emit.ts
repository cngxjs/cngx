import { DestroyRef, effect, inject } from '@angular/core';

import type { CngxPaginate } from './paginate.directive';

/**
 * Handlers the two-way emit bridge forwards page changes to - typically a
 * host component's `pageIndexChange` / `pageSizeChange` output emitters.
 *
 * @category common/data/paginate
 * @since 0.1.0
 */
export interface CngxPaginateEmitHandlers {
  /** Called once per effective page-index change. */
  readonly onIndex: (index: number) => void;
  /** Called once per effective page-size change. */
  readonly onSize: (size: number) => void;
}

/**
 * Wires the {@link CngxPaginate} brain's page / page-size changes onto a host's
 * two-way outputs with exactly-once emit semantics. Two paths feed each handler,
 * sharing a last-emitted guard:
 * - a subscription forwards the brain's nav-only `pageChange` / `pageSizeChange`
 *   - the only signal that captures a controlled-mode `setPage`, because the
 *   brain's `pageIndex()` stays pinned to the input until the consumer feeds it
 *   back;
 * - an `effect()` reads the effective `pageIndex()` / `pageSize()` and covers a
 *   `total`-shrink clamp the nav-only output misses.
 *
 * The shared guard makes a value one path already emitted a no-op on the other,
 * so each change emits exactly once. Seeded with the current effective values,
 * so wiring emits no initial change.
 *
 * Shared verbatim by the `CngxPaginator` shell and the `CngxIncrementalList`
 * organism, so the two-way emit behaviour is byte-identical. Call inside an
 * injection context (constructor or field initialiser) - it reads `DestroyRef`
 * and creates effects.
 *
 * @category common/data/paginate
 * @since 0.1.0
 */
export function connectPaginateEmit(
  paginate: CngxPaginate,
  handlers: CngxPaginateEmitHandlers,
): void {
  const destroyRef = inject(DestroyRef);

  // Shared last-emitted guards across the nav (subscription) and clamp (effect)
  // paths. Plain locals, so the effects carry no signal write. Seeded with the
  // current effective values so wiring emits no initial change.
  let lastIndex = paginate.pageIndex();
  let lastSize = paginate.pageSize();

  // Nav path. Forwards the brain's nav-only outputs: in controlled mode a
  // setPage leaves the effective pageIndex() pinned to the input, so this event
  // is the only thing that reports the navigation.
  const indexSub = paginate.pageChange.subscribe((index) => {
    if (index !== lastIndex) {
      lastIndex = index;
      handlers.onIndex(index);
    }
  });
  const sizeSub = paginate.pageSizeChange.subscribe((size) => {
    if (size !== lastSize) {
      lastSize = size;
      handlers.onSize(size);
    }
  });
  destroyRef.onDestroy(() => {
    indexSub.unsubscribe();
    sizeSub.unsubscribe();
  });

  // Clamp path. The effective pageIndex moved without a nav (a total-shrink
  // clamp the nav-only pageChange misses). The shared guard means a value the
  // nav path already emitted is a no-op here, so each change emits once.
  effect(() => {
    const index = paginate.pageIndex();
    if (index !== lastIndex) {
      lastIndex = index;
      handlers.onIndex(index);
    }
  });
  effect(() => {
    const size = paginate.pageSize();
    if (size !== lastSize) {
      lastSize = size;
      handlers.onSize(size);
    }
  });
}
