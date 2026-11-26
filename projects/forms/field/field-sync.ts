import { inject, type WritableSignal } from '@angular/core';
import { bindFieldValue } from './field-value-sync';
import { CngxFormFieldPresenter } from './form-field-presenter';

/**
 * Options for {@link createFieldSync}. Generic in `V` so the same factory
 * covers scalar and array value shapes.
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
  /**
   * Optional. Returns `true` when the raw field value is absent/invalid for a
   * control that always asserts its own value (a numeric slider is never
   * "empty"). When `true`, the field->control read is skipped (the control
   * keeps its value) and the control->field write is forced (the control seeds
   * the field on mount). Omit for controls where the field is the sole source
   * of truth - the default sync reads and writes symmetrically.
   */
  readonly shouldSkipFieldValue?: (fieldValue: unknown) => boolean;
}

/**
 * Bidirectional `Field <-> control` value sync via {@link CngxFormFieldPresenter}.
 *
 * Two `effect()`s, each reading the opposite branch inside `untracked()` with
 * `valueEquals` as the cycle break - the canonical bridge every `model()`-based
 * cngx control reuses instead of re-implementing field write-back. Both the
 * field and the control's `model()` are writable sources of truth, so this is
 * coordination, not a single `computed()`. Requires an injection context;
 * no-op without a surrounding `cngx-form-field`. A user change is compared
 * with the field's pending `controlValue`, so two changes inside a schema
 * `debounce()` window both land.
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
 * @since 0.3.0
 * @relatedTo CngxFormFieldPresenter, CNGX_FORM_FIELD_CONTROL
 */
export function createFieldSync<V>(options: FieldSyncOptions<V>): void {
  const presenter = inject(CngxFormFieldPresenter, { optional: true });
  if (!presenter) {
    return;
  }
  const control = options.componentValue;
  bindFieldValue(presenter.fieldState, () => control, options);
}

export { writeFieldValue, type FieldWriteMode } from './field-value-sync';
