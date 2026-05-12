import { InjectionToken, signal, type Signal } from '@angular/core';

import type { CngxSelectOptionDef } from './option.model';
import type { CngxSelectCompareFn } from './select-core';

/**
 * Append-only buffer for locally-patched options. `mergeLocalItems`
 * folds it onto server options inside `createSelectCore.effectiveOptions`
 * and drops entries matching a server value — quick-create items
 * disappear once the backend catches up. Consumer clears explicitly via
 * {@link LocalItemsBuffer.clear}; no auto-clear on state refresh.
 */
export interface LocalItemsBuffer<T> {
  /** Identity-stable until mutated. */
  readonly items: Signal<readonly CngxSelectOptionDef<T>[]>;
  /** No-op when an entry matches `item.value` under current `compareWith`. */
  patch(item: CngxSelectOptionDef<T>): void;
  /** Idempotent — no emit when already empty. */
  clear(): void;
}

/**
 * Builds a {@link LocalItemsBuffer}. Reads `compareWith` lazily so
 * mid-flight comparator swaps are honoured.
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
 * Factory signature for {@link CNGX_LOCAL_ITEMS_BUFFER_FACTORY}.
 */
export type CngxLocalItemsBufferFactory = <T>(
  compareWith: Signal<CngxSelectCompareFn<T>>,
) => LocalItemsBuffer<T>;

/**
 * Factory token for {@link LocalItemsBuffer}. Default
 * {@link createLocalItemsBuffer}. Override for audit logging, backend
 * sync, or localStorage persistence.
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
 */
export const CNGX_LOCAL_ITEMS_BUFFER_FACTORY =
  new InjectionToken<CngxLocalItemsBufferFactory>(
    'CngxLocalItemsBufferFactory',
    {
      providedIn: 'root',
      factory: () => createLocalItemsBuffer,
    },
  );
