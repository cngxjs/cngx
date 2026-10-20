import { DestroyRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { form, max, schema } from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';

import type { CngxErrorFieldState, CngxFieldAccessor, CngxFieldValidationError } from './models';
import { adaptFormControl } from './form-control-adapter';

// The structural error type is what lets one source type-check against Signal
// Forms 21.1 (`ValidationError.WithField`), 21.2 (`WithFieldTree`) and 22
// (read-only field tree). The typed assignments below are the check: they
// compile on every one of those versions or the spec does not build.
describe('CngxFieldValidationError', () => {
  function seatsForm() {
    return TestBed.runInInjectionContext(() =>
      form(
        signal({ seats: 20 }),
        schema<{ seats: number }>((root) => {
          max(root.seats, 10, { message: 'At most 10' });
        }),
      ),
    );
  }

  it('accepts a Signal Forms field as a CngxFieldAccessor', () => {
    const booking = seatsForm();
    const accessor: CngxFieldAccessor<number> = booking.seats;
    expect(accessor().value()).toBe(20);
  });

  it('reads Signal Forms errors and their field through the structural type', () => {
    const booking = seatsForm();
    const errors: readonly CngxFieldValidationError[] = booking.seats().errors();
    expect(errors.map((error) => error.kind)).toEqual(['max']);

    const state: CngxErrorFieldState = errors[0].fieldTree();
    expect(typeof state.focusBoundControl).toBe('function');
  });

  it('accepts a summary of the whole form', () => {
    const booking = seatsForm();
    const summary: readonly CngxFieldValidationError[] = booking().errorSummary();
    expect(summary).toHaveLength(1);
  });
});

describe('adaptFormControl errors', () => {
  it('carry an inert field whose focus hook is safe to call', () => {
    const control = new FormControl('', { validators: [Validators.required] });
    const accessor = adaptFormControl(control, 'name', TestBed.inject(DestroyRef));
    const [error] = accessor().errors();
    expect(error.kind).toBe('required');
    expect(() => error.fieldTree().focusBoundControl()).not.toThrow();
  });
});
