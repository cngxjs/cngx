import { Component, DestroyRef, LOCALE_ID, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, required, schema } from '@angular/forms/signals';
import { CngxFieldErrors, CngxFormField, CngxLabel, adaptFormControl } from '@cngx/forms/field';
import { time, timeRange } from '@cngx/forms/validators';
import { describe, expect, it } from 'vitest';
import { CngxInput } from './input.directive';
import { CngxInputMask } from './input-mask.directive';

@Component({
  template: `
    <cngx-form-field [field]="f.at">
      <label cngxLabel>Start</label>
      <input cngxInput cngxInputMask="time:12" [formField]="f.at" />
      <cngx-field-errors />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxLabel, CngxFieldErrors, CngxInput, CngxInputMask, FormField],
})
class SignalFormsHost {
  readonly model = signal({ at: '' });
  readonly f = form(
    this.model,
    schema<{ at: string }>((root) => {
      required(root.at);
      time(root.at, { cycle: 12 });
    }),
  );
}

@Component({
  template: `
    <cngx-form-field [field]="f.at">
      <label cngxLabel>Start</label>
      <input cngxInput cngxInputMask="time" [formField]="f.at" />
      <cngx-field-errors />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxLabel, CngxFieldErrors, CngxInput, CngxInputMask, FormField],
})
class LocaleCycleHost {
  readonly model = signal({ at: '' });
  readonly f = form(
    this.model,
    schema<{ at: string }>((root) => {
      time(root.at);
    }),
  );
}

@Component({
  template: `
    <cngx-form-field [field]="field">
      <label cngxLabel>Start</label>
      <input cngxInput [formControl]="control" />
      <cngx-field-errors />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxLabel, CngxFieldErrors, CngxInput, ReactiveFormsModule],
})
class ReactiveFormsHost {
  readonly control = new FormControl('', { nonNullable: true, validators: [timeRange()] });
  readonly field = adaptFormControl(this.control, 'at', inject(DestroyRef));
}

function setup() {
  const fixture = TestBed.createComponent(SignalFormsHost);
  fixture.detectChanges();
  TestBed.flushEffects();
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  return { fixture, input, host: fixture.componentInstance };
}

function blur(input: HTMLInputElement, fixture: ReturnType<typeof TestBed.createComponent>): void {
  input.dispatchEvent(new Event('focus'));
  input.dispatchEvent(new Event('blur'));
  flush(fixture);
}

function errorText(fixture: ReturnType<typeof TestBed.createComponent>): string {
  const errors = fixture.nativeElement.querySelector('cngx-field-errors') as HTMLElement;
  return errors.textContent?.trim() ?? '';
}

function flush(fixture: ReturnType<typeof TestBed.createComponent>): void {
  fixture.detectChanges();
  TestBed.flushEffects();
}

function type(
  input: HTMLInputElement,
  chars: string,
  fixture: ReturnType<typeof TestBed.createComponent>,
): void {
  for (const ch of chars) {
    const pos = input.value.indexOf('_');
    const at = pos === -1 ? input.value.length : pos;
    input.setSelectionRange(at, at);
    input.dispatchEvent(
      new InputEvent('beforeinput', { inputType: 'insertText', data: ch, cancelable: true }),
    );
    flush(fixture);
  }
}

describe('masked time field under Signal Forms', () => {
  it('writes the raw mask value into the model and shows the display string', () => {
    const { fixture, input, host } = setup();

    type(input, '1430PM', fixture);

    expect(host.model().at).toBe('1430PM');
    expect(input.value).toBe('14:30 PM');
  });

  it('projects the field ARIA through cngxInput onto the masked input', () => {
    const { fixture, input } = setup();

    input.dispatchEvent(new Event('focus'));
    input.dispatchEvent(new Event('blur'));
    flush(fixture);

    expect(input.getAttribute('aria-invalid')).toBe('true');
    const describedBy = input.getAttribute('aria-describedby') ?? '';
    const errors = fixture.nativeElement.querySelector('cngx-field-errors') as HTMLElement;
    const errorIds = Array.from(errors.querySelectorAll('[id]')).map((el) => el.id);
    const ownIds = errors.id ? [errors.id] : [];
    expect([...ownIds, ...errorIds].some((id) => describedBy.split(' ').includes(id))).toBe(true);
    expect(errors.textContent?.trim().length).toBeGreaterThan(0);
  });
});

describe('time validator on masked fields', () => {
  it('reports an out-of-range 12-hour time on the field, its ARIA and its message', () => {
    const { fixture, input, host } = setup();

    type(input, '1430PM', fixture);
    blur(input, fixture);

    expect(host.f.at().errors()).toEqual([
      expect.objectContaining({ kind: 'timeRange', cycle: 12 }),
    ]);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(errorText(fixture)).toBe('Enter a valid time.');
  });

  it('reports nothing for a valid 12-hour time', () => {
    const { fixture, input, host } = setup();

    type(input, '0230PM', fixture);
    blur(input, fixture);

    expect(host.f.at().errors()).toEqual([]);
    expect(input.getAttribute('aria-invalid')).not.toBe('true');
  });

  it('judges a bare time mask on a 24-hour locale by the 24-hour cycle', () => {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'de-DE' }] });
    const fixture = TestBed.createComponent(LocaleCycleHost);
    flush(fixture);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    type(input, '2500', fixture);
    blur(input, fixture);

    expect(input.value).toBe('25:00');
    expect(fixture.componentInstance.f.at().errors()).toEqual([
      expect.objectContaining({ kind: 'timeRange', cycle: 24 }),
    ]);
    expect(errorText(fixture)).toBe('Enter a valid time.');
  });

  it('reports the same kind under Reactive Forms through adaptFormControl', () => {
    const fixture = TestBed.createComponent(ReactiveFormsHost);
    flush(fixture);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = '25:00';
    input.dispatchEvent(new Event('input'));
    blur(input, fixture);

    expect(fixture.componentInstance.control.errors).toEqual({ timeRange: { cycle: 24 } });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(errorText(fixture)).toBe('Enter a valid time.');
  });
});
