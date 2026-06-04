import {
  type AbstractControl,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { adaptFormControl } from './form-control-adapter';
import { CngxFormField } from './form-field.component';
import { CngxFormFieldPresenter } from './form-field-presenter';
import { CngxInput, CngxNumericInput } from '@cngx/forms/input';
import { CngxFieldErrors } from './field-errors.component';
import { CNGX_ERROR_MESSAGES } from './form-field.token';
import type { CngxFieldAccessor } from './models';

function adapt(control: AbstractControl, name: string): CngxFieldAccessor {
  return TestBed.runInInjectionContext(() =>
    adaptFormControl(control, name, inject(DestroyRef)),
  );
}

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <input cngxInput [formControl]="control" />
      <cngx-field-errors />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxInput, CngxFieldErrors, ReactiveFormsModule],
})
class TestHost {
  private readonly destroyRef = inject(DestroyRef);
  control = new FormControl('', [Validators.required, Validators.email]);
  field = signal<CngxFieldAccessor>(adaptFormControl(this.control, 'email', this.destroyRef));
}

describe('adaptFormControl', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('returns a CngxFieldAccessor', () => {
    const control = new FormControl('');
    const accessor = adapt(control, 'test');
    expect(typeof accessor).toBe('function');
    const ref = accessor();
    expect(ref.name()).toBe('test');
  });

  it('reads value from control', () => {
    const control = new FormControl('hello');
    const ref = adapt(control, 'test')();
    expect(ref.value()).toBe('hello');
  });

  it('reads required state', () => {
    const control = new FormControl('', Validators.required);
    const ref = adapt(control, 'test')();
    expect(ref.required()).toBe(true);
  });

  it('reads invalid state', () => {
    const control = new FormControl('', Validators.required);
    const ref = adapt(control, 'test')();
    expect(ref.invalid()).toBe(true);
    expect(ref.valid()).toBe(false);
  });

  it('syncs touched state from externally-driven control.markAsTouched()', () => {
    const control = new FormControl('');
    const ref = adapt(control, 'test')();
    expect(ref.touched()).toBe(false);

    control.markAsTouched();
    TestBed.flushEffects();

    expect(ref.touched()).toBe(true);
  });

  it('syncs dirty state from externally-driven control.markAsDirty()', () => {
    const control = new FormControl('');
    const ref = adapt(control, 'test')();
    expect(ref.dirty()).toBe(false);

    control.markAsDirty();
    TestBed.flushEffects();

    expect(ref.dirty()).toBe(true);
  });

  it('adapts errors to kind-based format', () => {
    const control = new FormControl('', Validators.required);
    const ref = adapt(control, 'test')();
    const errors = ref.errors();
    expect(errors.length).toBe(1);
    expect(errors[0].kind).toBe('required');
  });

  it('works inside cngx-form-field', () => {
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [{ provide: CNGX_ERROR_MESSAGES, useValue: { required: () => 'Required.' } }],
    });
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    const presenter = fixture.debugElement
      .query(By.directive(CngxFormField))
      .injector.get(CngxFormFieldPresenter);

    expect(presenter.name()).toBe('email');
    expect(presenter.required()).toBe(true);
    expect(presenter.invalid()).toBe(true);
  });

  it('adapts an RF FormControl<number | null> and reflects value updates', () => {
    const control = new FormControl<number | null>(null);
    const ref = adapt(control, 'amount')();

    expect(ref.value()).toBeNull();

    control.setValue(1234.5);
    TestBed.flushEffects();
    expect(ref.value()).toBe(1234.5);

    control.setValue(null);
    TestBed.flushEffects();
    expect(ref.value()).toBeNull();
  });

  it('exposes the adapted field to cngx-form-field for number-valued controls', () => {
    @Component({
      template: `
        <cngx-form-field [field]="field()">
          <input cngxNumericInput cngxBindField />
        </cngx-form-field>
      `,
      imports: [CngxFormField, CngxNumericInput, ReactiveFormsModule],
    })
    class NumericRfHost {
      private readonly destroyRef = inject(DestroyRef);
      readonly control = new FormControl<number | null>(null);
      readonly field = signal<CngxFieldAccessor>(
        adaptFormControl(this.control, 'amount', this.destroyRef),
      );
    }

    TestBed.configureTestingModule({ imports: [NumericRfHost] });
    const fixture = TestBed.createComponent(NumericRfHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    const presenter = fixture.debugElement
      .query(By.directive(CngxFormField))
      .injector.get(CngxFormFieldPresenter);

    expect(presenter.name()).toBe('amount');
  });
});
