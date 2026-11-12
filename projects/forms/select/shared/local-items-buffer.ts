import { InjectionToken, signal, type Signal } from '@angular/core';

import type { CngxSelectOptionDef } from './option.model';
import type { CngxSelectCompareFn } from './internal/select-core';

/**
 * Append-only buffer for locally-patched options. `mergeLocalItems`
 * folds it onto server options inside `createSelectCore.effectiveOptions`
 * and drops entries matching a server value - quick-create items
 * disappear once the backend catches up. Consumer clears explicitly via
 * {@link LocalItemsBuffer.clear}; no auto-clear on state refresh.
 */
export interface LocalItemsBuffer<T> {
  /** Identity-stable until mutated. */
  readonly items: Signal<readonly CngxSelectOptionDef<T>[]>;
  /** No-op when an entry matches `item.value` under current `compareWith`. */
  patch(item: CngxSelectOptionDef<T>): void;
  /** Idempotent - no emit when already empty. */
  clear(): void;
}

/**
 * Builds the default `LocalItemsBuffer`. Reads `compareWith` lazily so
 * mid-flight comparator swaps are honoured.
 *
 * @example
 * ```ts
 * const buffer = createLocalItemsBuffer<string>(signal(Object.is));
 * buffer.patch({ value: 'urgent', label: 'Urgent' });
 * buffer.patch({ value: 'urgent', label: 'Urgent again' });
 * buffer.items().length === 1;
 * ```
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
 * Function shape a replacement local-items buffer must have.
 *
 * Every composite except `CngxTreeSelect` calls it once during construction
 * with its live `compareWith`, and the quick-create handler of the two action
 * hosts patches created items into it. The buffer only grows until the
 * composite calls `clear`; a state refresh does not empty it. Provide it
 * through {@link CNGX_LOCAL_ITEMS_BUFFER_FACTORY}.
 */
export type CngxLocalItemsBufferFactory = <T>(
  compareWith: Signal<CngxSelectCompareFn<T>>,
) => LocalItemsBuffer<T>;

/**
 * Factory token for {@link LocalItemsBuffer}. Default
 * {@link createLocalItemsBuffer}. Override for audit logging, backend
 * sync, or localStorage persistence.
 *
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
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/local-items-buffer.ts
 * @since 0.1.0
 */
export const CNGX_LOCAL_ITEMS_BUFFER_FACTORY = new InjectionToken<CngxLocalItemsBufferFactory>(
  'CngxLocalItemsBufferFactory',
  {
    providedIn: 'root',
    factory: () => createLocalItemsBuffer,
  },
);
