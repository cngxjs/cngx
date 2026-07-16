import { effect, inject, untracked, type WritableSignal } from '@angular/core';
import { CngxFormFieldPresenter } from './form-field-presenter';
import type { CngxFieldRef } from './models';

/**
 * Options for {@link createFieldSync}. Generic in `V` so the same factory
 * covers scalar and array value shapes.
 *
 * @category forms/field
 */
export interface FieldSyncOptions<V> {
  /** Source of truth for the control's bound value (a `model()` signal). */
  readonly componentValue: WritableSignal<V>;
  /** Truthy result suppresses both directions of sync (the cycle guard). */
  readonly valueEquals: (a: V, b: V) => boolean;
  /** Normalise `fieldRef.value()` (`unknown` through `CngxFieldRef`) into `V`. */
  readonly coerceFromField: (fieldValue: unknown) => V;
  /** Transform applied before writing `V` back to the field. Default: identity. */
  readonly toFieldValue?: (v: V) => unknown;
}

/**
 * Bidirectional `Field <-> control` value sync via {@link CngxFormFieldPresenter}.
 *
 * Two `effect()`s, each reading the opposite branch inside `untracked()` with
 * `valueEquals` as the cycle break - the canonical bridge every `model()`-based
 * cngx control reuses instead of re-implementing field write-back. Both the
 * field and the control's `model()` are writable sources of truth, so this is
 * coordination, not a single `computed()`. Requires an injection context;
 * no-op without a surrounding `cngx-form-field`.
 *
 * Keeps the `create*` prefix despite calling `inject()` in its body: it is a
 * blessed exception (see architecture-summary, mirrors `adaptFormControl`),
 * not an oversight. The name is also the public `@cngx/forms/select` export;
 * renaming would break that contract.
 *
 * ```ts
 * createFieldSync<number>({
 *   componentValue: this.value,
 *   valueEquals: Object.is,
 *   coerceFromField: (v) => (typeof v === 'number' ? v : 0),
 * });
 * ```
 *
 * @category forms/field
 * @since 0.1.0
 * @relatedTo CngxFormFieldPresenter, CNGX_FORM_FIELD_CONTROL
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
      if (options.valueEquals(options.coerceFromField(fieldRef.value()), next)) {
        return;
      }
      writeFieldValue(fieldRef, toField(next));
    });
  });
}

/**
 * Writes through Signal Forms' `WritableSignal`-shaped `FieldState.value`.
 * `CngxFieldRef` hides writability for API stability; narrow it here. Skips
 * readonly refs (e.g. mock fields) silently. Shared with the `model()`-based
 * field bridges via a relative import; not part of the public API.
 *
 * @internal
 */
export function writeFieldValue(fieldRef: CngxFieldRef, value: unknown): void {
  const signalLike = fieldRef.value as unknown;
  if (
    typeof signalLike === 'function' &&
    'set' in signalLike &&
    typeof (signalLike as { set: unknown }).set === 'function'
  ) {
    (signalLike as { set: (v: unknown) => void }).set(value);
  }
}
