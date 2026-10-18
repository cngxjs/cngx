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
  const skip = options.shouldSkipFieldValue;

  effect(() => {
    const fieldRef: CngxFieldRef = presenter.fieldState();
    const raw = fieldRef.value();
    if (skip?.(raw)) {
      return;
    }
    const fieldValue = options.coerceFromField(raw);
    untracked(() => {
      const current = options.componentValue();
      if (!options.valueEquals(current, fieldValue)) {
        options.componentValue.set(fieldValue);
      }
    });
  });

  // The first run is the mount seed; every later run is a user change. The
  // flag is consumed even when that first run writes nothing.
  let seeded = false;
  effect(() => {
    const next = options.componentValue();
    const mode: FieldWriteMode = seeded ? 'user' : 'seed';
    seeded = true;
    untracked(() => {
      const fieldRef = presenter.fieldState();
      const raw = fieldRef.value();
      // A skipped (absent) field has no value to guard against - force the seed
      // write. Otherwise skip the write when the field already equals `next`.
      if (!skip?.(raw) && options.valueEquals(options.coerceFromField(raw), next)) {
        return;
      }
      writeFieldValue(fieldRef, toField(next), mode);
    });
  });
}

/**
 * How {@link writeFieldValue} writes: `'seed'` mirrors the control's mount
 * value into the field and leaves it pristine, `'user'` is an interaction
 * and dirties the field.
 *
 * @internal
 */
export type FieldWriteMode = 'seed' | 'user';

/**
 * Writes a control value into the field. A `'user'` write goes through Signal
 * Forms' writable `FieldState.controlValue` when the ref has one (Signal Forms
 * marks the field dirty there and honours a schema `debounce()`); a ref
 * without it gets `value.set` plus `markAsDirty()`. A `'seed'` write uses
 * `value.set` only. `CngxFieldRef` hides writability for API stability;
 * narrow it here. Skips readonly refs silently. Shared with the
 * `model()`-based field bridges via a relative import; not part of the
 * public API.
 *
 * @internal
 */
export function writeFieldValue(
  fieldRef: CngxFieldRef,
  value: unknown,
  mode: FieldWriteMode,
): void {
  if (mode === 'user') {
    const controlValue = asWritable((fieldRef as { readonly controlValue?: unknown }).controlValue);
    if (controlValue) {
      controlValue.set(value);
      return;
    }
  }
  const target = asWritable(fieldRef.value);
  if (!target) {
    return;
  }
  target.set(value);
  if (mode === 'user') {
    fieldRef.markAsDirty();
  }
}

function asWritable(candidate: unknown): { set: (v: unknown) => void } | null {
  if (
    typeof candidate === 'function' &&
    'set' in candidate &&
    typeof (candidate as { set: unknown }).set === 'function'
  ) {
    return candidate as unknown as { set: (v: unknown) => void };
  }
  return null;
}
