import { InjectionToken, signal, type Signal } from '@angular/core';

import type { CngxSelectOptionDef } from './option.model';
import type { CngxSelectCompareFn } from './select-core';

/**
 * Persistent append-only buffer for locally-patched options. Used by
 * every select-family variant that wants to host inline quick-create
 * workflows — {@link /projects/forms/select/src/lib/shared/option.model.ts
 * mergeLocalItems} folds the buffer onto the server-provided options
 * pre-filter inside `createSelectCore.effectiveOptions`.
 *
 * The buffer is intentionally stateful: items stay until
 * {@link LocalItemsBuffer.clear} is called explicitly (no auto-clear
 * on state-refresh). The `mergeLocalItems` helper handles the other
 * direction of the lifecycle — local items matching a server option
 * are dropped silently at merge time, which lets optimistic
 * quick-create items "disappear" once the backend catches up without
 * any consumer wiring.
 *
 * @category interactive
 */
export interface LocalItemsBuffer<T> {
  /** Readonly snapshot of the current buffer. Identity-stable until mutated. */
  readonly items: Signal<readonly CngxSelectOptionDef<T>[]>;
  /**
   * Append `item` to the buffer. No-op when the buffer already carries
   * an entry matching `item.value` under the current `compareWith` —
   * prevents duplicates from accumulating across repeated patch calls.
   */
  patch(item: CngxSelectOptionDef<T>): void;
  /** Reset the buffer to empty. Idempotent — no emit when already empty. */
  clear(): void;
}

/**
 * Create a {@link LocalItemsBuffer} for a select-family variant. The
 * buffer reads the component's `compareWith` signal lazily at patch
 * time so a consumer who swaps comparator mid-flight (rare, but
 * supported) gets consistent dedup semantics with the selection
 * controller and `mergeLocalItems`.
 *
 * @category interactive
 */
export function createLocalItemsBuffer<T>(
  compareWith: Signal<CngxSelectCompareFn<T>>,
): LocalItemsBuffer<T> {
  const items = signal<readonly CngxSelectOptionDef<T>[]>([]);

  return {
    items: items.asReadonly(),
    patch(item: CngxSelectOptionDef<T>): void {
      const eq = compareWith();
      const current = items();
      for (const existing of current) {
        if (eq(existing.value, item.value)) {
          return;
        }
      }
      items.set([...current, item]);
    },
    clear(): void {
      if (items().length === 0) {
        return;
      }
      items.set([]);
    },
  };
}

/**
 * Factory signature matching {@link createLocalItemsBuffer} — used by
 * {@link CNGX_LOCAL_ITEMS_BUFFER_FACTORY} for DI-swappable buffer
 * implementations.
 *
 * @category interactive
 */
export type CngxLocalItemsBufferFactory = <T>(
  compareWith: Signal<CngxSelectCompareFn<T>>,
) => LocalItemsBuffer<T>;

/**
 * DI token resolving the factory used to instantiate a
 * {@link LocalItemsBuffer}. Defaults to {@link createLocalItemsBuffer};
 * override to wrap patches with audit logging, backend-sync mirroring,
 * localStorage persistence, or any other enterprise data-lifecycle
 * concern without forking the select-family variants.
 *
 * Symmetrical to `CNGX_ACTION_HOST_BRIDGE_FACTORY` /
 * `CNGX_CREATE_COMMIT_HANDLER_FACTORY` — same factory-swap contract,
 * complementary layer (persistence vs. commit vs. UX guard).
 *
 * @example
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [
 *     {
 *       provide: CNGX_LOCAL_ITEMS_BUFFER_FACTORY,
 *       useValue: <T>(compareWith) => {
 *         const buf = createLocalItemsBuffer<T>(compareWith);
 *         return {
 *           items: buf.items,
 *           patch(item) { auditLog('patch', item); buf.patch(item); },
 *           clear() { auditLog('clear'); buf.clear(); },
 *         };
 *       },
 *     },
 *   ],
 * });
 * ```
 *
 * @category interactive
 */
export const CNGX_LOCAL_ITEMS_BUFFER_FACTORY =
  new InjectionToken<CngxLocalItemsBufferFactory>(
    'CngxLocalItemsBufferFactory',
    {
      providedIn: 'root',
      factory: () => createLocalItemsBuffer,
    },
  );
