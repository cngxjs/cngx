import { effect, inject, untracked, type WritableSignal } from '@angular/core';

import { CngxFormFieldPresenter, type CngxFieldRef } from '@cngx/forms/field';

/**
 * Options for {@link createFieldSync}. Generic in `V` so one factory
 * covers scalar (`T | undefined` for single-select / typeahead) and array
 * (`T[]` for multi-select / combobox) shapes without branching internally.
 *
 * @category interactive
 */
export interface FieldSyncOptions<V> {
  /**
   * Source of truth for the component's bound value. Reads flow from
   * `fieldRef.value()` into this signal; writes flow the other way.
   */
  readonly componentValue: WritableSignal<V>;
  /**
   * Equality between two `V` values. Returning `true` suppresses both
   * directions of sync so the factory never produces a redundant write.
   * Consumers that compare arrays should wrap
   * {@link (sameArrayContents:function)} with the component's `compareWith`.
   */
  readonly valueEquals: (a: V, b: V) => boolean;
  /**
   * Normalise `fieldRef.value()` (typed `unknown` through `CngxFieldRef`)
   * into the component's `V` shape. Scalar callers typically cast; array
   * callers coerce non-arrays to `[]` and clone to prevent outside
   * mutation.
   */
  readonly coerceFromField: (fieldValue: unknown) => V;
  /**
   * Optional transform applied before writing `V` back to the field.
   * Default: identity. Array callers supply `(v) => [...v]` so the field
   * owns its own copy.
   */
  readonly toFieldValue?: (v: V) => unknown;
}

/**
 * Bidirectional sync between a component's value signal and the field
 * bound through {@link CngxFormFieldPresenter}. Runs in an injection
 * context; installs two cleanup-bound `effect()`s:
 *
 * 1. **Field → component** — tracks `fieldRef.value()` and writes the
 *    coerced value into `componentValue` when it diverges. The write is
 *    wrapped in `untracked` so `componentValue` is not added as a read
 *    dependency.
 * 2. **Component → field** — tracks `componentValue` and writes it back
 *    through the field's writable-signal interface. Both `fieldState()`
 *    and the current field value are read inside `untracked` so changes
 *    to the field do not retrigger this direction.
 *
 * Both directions guard with `valueEquals` to break the write-back cycle.
 * When no presenter is injected (component used standalone without a
 * `<cngx-form-field>` wrapper), the factory is a no-op.
 *
 * @category interactive
 */
export function createFieldSync<V>(options: FieldSyncOptions<V>): void {
  const presenter = inject(CngxFormFieldPresenter, { optional: true });
  if (!presenter) {
    return;
  }
  const toField = options.toFieldValue ?? ((v: V) => v as unknown);

  // Field → component.
  effect(() => {
    const fieldRef: CngxFieldRef = presenter.fieldState();
    const fieldValue = options.coerceFromField(fieldRef.value());
    untracked(() => {
      const current = options.componentValue();
      if (!options.valueEquals(current, fieldValue)) {
        options.componentValue.set(fieldValue);
      }
    });
  });

  // Component → field.
  effect(() => {
    const next = options.componentValue();
    untracked(() => {
      const fieldRef = presenter.fieldState();
      const currentField = options.coerceFromField(fieldRef.value());
      if (options.valueEquals(currentField, next)) {
        return;
      }
      writeFieldValue(fieldRef, toField(next));
    });
  });
}

/**
 * Best-effort writer for Angular Signal Forms' `WritableSignal`-shaped
 * `FieldState.value`. A structural check guards against non-writable
 * refs; readonly fields are silently skipped so the factory stays a
 * no-op in invalid setups rather than throwing.
 */
function writeFieldValue(fieldRef: CngxFieldRef, value: unknown): void {
  const signalLike = fieldRef.value as unknown;
  if (
    typeof signalLike === 'function' &&
    'set' in signalLike &&
    typeof (signalLike as { set: unknown }).set === 'function'
  ) {
    (signalLike as { set: (v: unknown) => void }).set(value);
  }
}
