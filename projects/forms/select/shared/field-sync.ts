import { inject, InjectionToken } from '@angular/core';

import { createFieldSync as createFieldSyncField, type FieldSyncOptions } from '@cngx/forms/field';

/**
 * Provide truthy in a subtree to suppress {@link createFieldSync} for every
 * descendant select. The form-field bridge (disabled / focused / errorState)
 * stays intact - only the bidirectional value-sync is opted out. Use when a
 * composite control (e.g. `cngx-filter-builder`) is the form-field's control
 * and its inner pickers must not write the composite's object value into
 * their own scalar `value` model.
 *
 * @category forms/select/state
 */
export const CNGX_SELECT_DISABLE_FIELD_SYNC = new InjectionToken<boolean>(
  'CNGX_SELECT_DISABLE_FIELD_SYNC',
);

export type { FieldSyncOptions };

/**
 * Gate-aware wrapper over the canonical `createFieldSync` from
 * `@cngx/forms/field`. Returns early when {@link CNGX_SELECT_DISABLE_FIELD_SYNC}
 * is provided truthy in the injection context; otherwise delegates to the one
 * bridge implementation. Array-shape callers keep working unchanged: the field
 * `createFieldSync<V>` is generic in `V` and the composites already pass their
 * own `valueEquals` / `coerceFromField` / `toFieldValue`.
 *
 * Kept as the select-local export so the 9 select composites and
 * `cngx-filter-builder` import the gate and the sync from one module.
 *
 * @category forms/select/state
 */
export function createFieldSync<V>(options: FieldSyncOptions<V>): void {
  if (inject(CNGX_SELECT_DISABLE_FIELD_SYNC, { optional: true })) {
    return;
  }
  createFieldSyncField(options);
}
