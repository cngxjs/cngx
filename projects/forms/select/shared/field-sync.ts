import { effect, inject, untracked, type WritableSignal } from '@angular/core';

import { CngxFormFieldPresenter, type CngxFieldRef } from '@cngx/forms/field';

/**
 * Options for {@link createFieldSync}. Generic in `V` so the same factory
 * covers scalar and array value shapes.
 *
 * @category forms/select/state
 */
export interface FieldSyncOptions<V> {
  /** Source of truth for the component's bound value. */
  readonly componentValue: WritableSignal<V>;
  /**
   * Truthy result suppresses both directions of sync. Array callers wrap
   * {@link (sameArrayContents:function)} with the component's `compareWith`.
   */
  readonly valueEquals: (a: V, b: V) => boolean;
  /**
   * Normalise `fieldRef.value()` (`unknown` through `CngxFieldRef`) into `V`.
   * Array callers coerce non-arrays to `[]` and clone.
   */
  readonly coerceFromField: (fieldValue: unknown) => V;
  /**
   * Transform applied before writing `V` back to the field. Default: identity.
   * Array callers supply `(v) => [...v]` so the field owns its own copy.
   */
  readonly toFieldValue?: (v: V) => unknown;
}

/**
 * Bidirectional `Field ↔ component` sync via {@link CngxFormFieldPresenter}.
 * Two `effect()`s with `untracked` reads on the opposite branch and
 * `valueEquals` as the cycle guard. Injection context required; no-op
 * without a presenter.
 *
 * @category forms/select/state
 */
export function createFieldSync<V>(options: FieldSyncOptions<V>): void {
  const presenter = inject(CngxFormFieldPresenter, { optional: true });
  if (!presenter) {
    return;
  }
  const toField = options.toFieldValue ?? ((v: V) => v as unknown);

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
 * Writes through Signal Forms' `WritableSignal`-shaped `FieldState.value`.
 * Skips readonly refs silently.
 *
 * @internal
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
