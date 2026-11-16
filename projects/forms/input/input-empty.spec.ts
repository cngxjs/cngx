import { Component, DestroyRef, inject, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { afterEach, describe, expect, it } from 'vitest';

import { adaptFormControl, CngxFormField, CngxLabel } from '@cngx/forms/field';

import { CngxInput } from './input.directive';

// `empty` follows the field value under a presenter, so a programmatic write
// or clear paints `cngx-field--empty` at once; a user typing into an input
// that is not bound to the field still counts.

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

function mount<T>(type: Type<T>) {
  const fixture = TestBed.createComponent(type);
  document.body.appendChild(fixture.nativeElement);
  fixture.detectChanges();
  flush(fixture);
  const el = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    host: fixture.componentInstance,
    input: el.querySelector('input')!,
    empty: () => el.querySelector('cngx-form-field')!.classList.contains('cngx-field--empty'),
  };
}

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('CngxInput empty', () => {
  @Component({
    template: `
      <cngx-form-field [field]="f.name">
        <label cngxLabel>Name</label>
        <input cngxInput [formField]="f.name" />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxLabel, CngxInput, FormField],
  })
  class BoundHost {
    readonly f = form(signal({ name: '' }));
  }

  it('follows programmatic writes and clears of the field value', () => {
    const { fixture, host, input, empty } = mount(BoundHost);
    expect(empty()).toBe(true);
    host.f.name().value.set('Ada');
    flush(fixture);
    expect(empty()).toBe(false);
    type(input, 'Grace');
    flush(fixture);
    expect(empty()).toBe(false);
    host.f.name().value.set('');
    flush(fixture);
    expect(empty()).toBe(true);
  });

  @Component({
    template: `
      <cngx-form-field [field]="f.name">
        <label cngxLabel>Name</label>
        <input cngxInput [formField]="f.name" />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxLabel, CngxInput, FormField],
  })
  class SeededHost {
    readonly f = form(signal({ name: 'Ada' }));
  }

  it('is not empty on the first render of a seeded field', () => {
    const { empty } = mount(SeededHost);
    expect(empty()).toBe(false);
  });

  @Component({
    template: `
      <cngx-form-field [field]="name">
        <label cngxLabel>Name</label>
        <input cngxInput [formControl]="control" />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxLabel, CngxInput, ReactiveFormsModule],
  })
  class AdaptedHost {
    readonly control = new FormControl('Ada', { nonNullable: true });
    readonly name = adaptFormControl(this.control, 'name', inject(DestroyRef));
  }

  it('follows an adapted Reactive Forms control set from code', () => {
    const { fixture, host, empty } = mount(AdaptedHost);
    expect(empty()).toBe(false);
    host.control.setValue('');
    flush(fixture);
    expect(empty()).toBe(true);
  });

  @Component({
    template: `
      <cngx-form-field [field]="f.name">
        <label cngxLabel>Name</label>
        <input cngxInput />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxLabel, CngxInput],
  })
  class UnboundHost {
    readonly f = form(signal({ name: '' }));
  }

  it('counts typing into an input the field does not bind', () => {
    const { fixture, input, empty } = mount(UnboundHost);
    expect(empty()).toBe(true);
    type(input, 'x');
    flush(fixture);
    expect(empty()).toBe(false);
  });
});
