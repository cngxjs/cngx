import { type DestroyRef, signal, type Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { type AbstractControl, type ValidationErrors } from '@angular/forms';
import type { CngxFieldAccessor, CngxFieldRef } from './models';

/**
 * Adapts an Angular Reactive Forms `AbstractControl` (FormControl, FormGroup, FormArray)
 * to the `CngxFieldAccessor` interface expected by `cngx-form-field`.
 *
 * This enables using `cngx-form-field` without Signal Forms — for teams that haven't
 * migrated yet or for forms that use Reactive Forms by design.
 *
 * @param control The Reactive Forms control to adapt.
 * @param name A unique field name for deterministic ID generation.
 * @param destroyRef A `DestroyRef` for automatic subscription cleanup (pass `inject(DestroyRef)`).
 * @returns A `CngxFieldAccessor` compatible with `[field]` input on `cngx-form-field`.
 *
 * @example
 * ```typescript
 * readonly emailControl = new FormControl('', [Validators.required, Validators.email]);
 * readonly emailField = adaptFormControl(this.emailControl, 'email', inject(DestroyRef));
 * ```
 *
 * @category utilities
 */
export function adaptFormControl(
  control: AbstractControl,
  name: string,
  destroyRef?: DestroyRef,
): CngxFieldAccessor {
  const nameSignal = signal(name);
  const valueSignal = signal<unknown>(control.value);
  const touchedSignal = signal(control.touched);
  const dirtySignal = signal(control.dirty);
  const invalidSignal = signal(control.invalid);
  const validSignal = signal(control.valid);
  const requiredSignal = signal(hasRequiredValidator(control));
  const disabledSignal = signal(control.disabled);
  const pendingSignal = signal(control.pending);
  const errorsSignal = signal<{ kind: string; message?: string; fieldTree: unknown }[]>(
    adaptErrors(control.errors),
  );
  const readonlySignal = signal(false);
  const hiddenSignal = signal(false);
  const submittingSignal = signal(false);
  const patternSignal = signal<readonly RegExp[]>([]);

  const syncState = () => {
    valueSignal.set(control.value);
    touchedSignal.set(control.touched);
    dirtySignal.set(control.dirty);
    invalidSignal.set(control.invalid);
    validSignal.set(control.valid);
    disabledSignal.set(control.disabled);
    pendingSignal.set(control.pending);
    requiredSignal.set(hasRequiredValidator(control));
    errorsSignal.set(adaptErrors(control.errors));
  };

  // Subscribe with automatic cleanup via DestroyRef
  if (destroyRef) {
    control.statusChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(syncState);
    control.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(syncState);
  } else {
    control.statusChanges.subscribe(syncState);
    control.valueChanges.subscribe(syncState);
  }

  const ref: CngxFieldRef = {
    name: nameSignal.asReadonly(),
    value: valueSignal.asReadonly(),
    errors: errorsSignal.asReadonly() as Signal<never[]>,
    touched: touchedSignal.asReadonly(),
    dirty: dirtySignal.asReadonly(),
    invalid: invalidSignal.asReadonly(),
    valid: validSignal.asReadonly(),
    required: requiredSignal.asReadonly(),
    disabled: disabledSignal.asReadonly(),
    pending: pendingSignal.asReadonly(),
    hidden: hiddenSignal.asReadonly(),
    readonly: readonlySignal.asReadonly(),
    disabledReasons: signal([]).asReadonly(),
    minLength: undefined,
    maxLength: undefined,
    min: undefined,
    max: undefined,
    pattern: patternSignal.asReadonly(),
    errorSummary: errorsSignal.asReadonly() as Signal<never[]>,
    submitting: submittingSignal.asReadonly(),
    markAsTouched: () => {
      control.markAsTouched();
      syncState();
    },
    markAsDirty: () => {
      control.markAsDirty();
      syncState();
    },
    focusBoundControl: () => {
      /* noop — Reactive Forms has no focusBoundControl */
    },
    reset: (value?: unknown) => {
      control.reset(value);
      syncState();
    },
  };

  return () => ref;
}

/** Convert Reactive Forms ValidationErrors to our error format. */
function adaptErrors(
  errors: ValidationErrors | null,
): { kind: string; message?: string; fieldTree: unknown }[] {
  if (!errors) {
    return [];
  }
  return Object.entries(errors).map(([key, value]: [string, unknown]) => {
    const extra =
      typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
    return {
      kind: key,
      message: typeof value === 'string' ? value : undefined,
      fieldTree: (() => ({})) as unknown,
      ...extra,
    };
  });
}

/** Check if a control has the built-in required validator. */
function hasRequiredValidator(control: AbstractControl): boolean {
  if (!control.validator) {
    return false;
  }
  const result = control.validator({ value: '' } as AbstractControl);
  return result != null && 'required' in result;
}
