import { effect, untracked, type Signal, type WritableSignal } from '@angular/core';
import { cngxDevWarn } from '@cngx/utils';
import type { CngxErrorFieldState, CngxFieldRef } from './models';

// Field refs that already warned CNGX2032.
const handBoundWarned = new WeakSet<object>();

/**
 * Value options of {@link bindFieldValue}. The same shape as the value half
 * of `FieldSyncOptions`, minus the control signal, which comes in as a
 * target.
 *
 * @internal
 */
export interface FieldValueBindingOptions<V> {
  /** Truthy result suppresses both directions of sync (the cycle guard). */
  readonly valueEquals: (a: V, b: V) => boolean;
  /** Normalise `fieldRef.value()` (`unknown` through `CngxFieldRef`) into `V`. */
  readonly coerceFromField: (fieldValue: unknown) => V;
  /** Transform applied before writing `V` back to the field. Default: identity. */
  readonly toFieldValue?: (v: V) => unknown;
  /**
   * `true` for a raw field value the control does not read (it keeps its own
   * value and seeds the field instead).
   */
  readonly shouldSkipFieldValue?: (fieldValue: unknown) => boolean;
}

/**
 * Bidirectional `Field <-> control` value sync for one target signal at a
 * time. `target` may change identity (a presenter discovering its control) or
 * be `undefined` (no control to sync); the seed run is tracked per target, so
 * a control mounted after the first change detection is seeded pristine too.
 *
 * Two `effect()`s, each reading the opposite branch inside `untracked()` with
 * `valueEquals` as the cycle break. A user write is skipped when the field
 * already holds `next`; the comparison reads the pending `controlValue` where
 * Signal Forms exposes it, because `value()` lags behind a schema `debounce()`
 * and a second change inside the window would otherwise be dropped.
 *
 * In dev mode a user change the field already holds, which the field -> control
 * run did not write itself, means a second writer on the field (a hand
 * `[(value)]="f.x().value"` on the control): warns
 * [`CNGX2032`](/error-codes/cngx2032.md) once per field.
 *
 * Requires an injection context.
 *
 * @internal
 */
export function bindFieldValue<V>(
  fieldState: Signal<CngxFieldRef>,
  target: () => WritableSignal<V> | undefined,
  options: FieldValueBindingOptions<V>,
): void {
  const toField = options.toFieldValue ?? ((v: V) => v as unknown);
  const skip = options.shouldSkipFieldValue;
  // Dev only: the value the field -> control run last wrote into the control,
  // so the control -> field run can tell its own echo from a second writer.
  let pushed: { readonly value: V } | null = null;

  effect(() => {
    const control = target();
    if (!control) {
      return;
    }
    const raw = fieldState().value();
    if (skip?.(raw)) {
      return;
    }
    const fieldValue = options.coerceFromField(raw);
    untracked(() => {
      if (!options.valueEquals(control(), fieldValue)) {
        if (typeof ngDevMode !== 'undefined' && ngDevMode) {
          pushed = { value: fieldValue };
        }
        control.set(fieldValue);
      }
    });
  });

  // The first run per target is the mount seed; every later run is a user
  // change. The flag is consumed even when that first run writes nothing.
  let seededTarget: WritableSignal<V> | undefined;
  // Dev only: the target was gone (another owner took the value) and its first
  // run after the gap re-syncs, so it is no evidence of a second writer.
  let resumed = false;
  effect(() => {
    const control = target();
    if (!control) {
      resumed = seededTarget !== undefined;
      return;
    }
    const next = control();
    const mode: FieldWriteMode = seededTarget === control ? 'user' : 'seed';
    seededTarget = control;
    const rejoined = resumed;
    resumed = false;
    untracked(() => {
      const fieldRef = fieldState();
      const raw = fieldRef.value();
      // A skipped (absent) field has no value to guard against - force the seed
      // write. Otherwise skip the write when the field already holds `next`.
      if (skip?.(raw)) {
        writeFieldValue(fieldRef, toField(next), mode);
        return;
      }
      const pending = controlValueOf(fieldRef);
      const held =
        mode === 'user' && typeof pending === 'function' ? (pending as () => unknown)() : raw;
      const echo = pushed;
      pushed = null;
      if (options.valueEquals(options.coerceFromField(held), next)) {
        if (typeof ngDevMode !== 'undefined' && ngDevMode && mode === 'user') {
          // A hand binding hands the control's own value to the field: same
          // identity. An equal value under `compareWith` is a re-pick, not a writer.
          const handed = Object.is(held, next);
          const echoed = echo !== null && options.valueEquals(echo.value, next);
          warnIfHandBound(fieldRef, rejoined || !handed || echoed);
        }
        return;
      }
      writeFieldValue(fieldRef, toField(next), mode);
    });
  });
}

// The field already holds a user change it did not receive from this sync:
// something else wrote it, typically `[(value)]="f.x().value"` on the control.
// A `[formField]` on the field is a supported second owner (it writes through
// `controlValue` and dirties), so it never warns.
function warnIfHandBound(fieldRef: CngxFieldRef, explained: boolean): void {
  if (explained || handBoundWarned.has(fieldRef)) {
    return;
  }
  const bindings = (fieldRef as Partial<CngxErrorFieldState>).formFieldBindings?.();
  if (bindings && bindings.length > 0) {
    return;
  }
  handBoundWarned.add(fieldRef);
  cngxDevWarn(
    'CNGX2032',
    `[cngx-form-field] the field "${fieldRef.name()}" is also bound by hand on its control, ` +
      'so a change is written as a programmatic value: the field stays pristine and a schema ' +
      'debounce() is skipped. Remove the [(value)] binding; the field syncs the control.',
  );
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
    const controlValue = asWritable(controlValueOf(fieldRef));
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

function controlValueOf(fieldRef: CngxFieldRef): unknown {
  return (fieldRef as { readonly controlValue?: unknown }).controlValue;
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
