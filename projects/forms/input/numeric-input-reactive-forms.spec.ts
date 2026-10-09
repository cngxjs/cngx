import { Component, type Type, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { CngxFormBridge } from '@cngx/forms/controls';
import { describe, expect, it, vi } from 'vitest';
import { CngxNumericInput } from './numeric-input.directive';

@Component({
  selector: 'numeric-rf-host-1',
  template: `<input cngxNumericInput [locale]="'de-DE'" [formControl]="control" />`,
  imports: [CngxNumericInput, ReactiveFormsModule, CngxFormBridge],
})
class RfHost {
  readonly control = new FormControl<number | null>(null);
}

@Component({
  selector: 'numeric-rf-host-2',
  template: `<input cngxNumericInput [locale]="'de-DE'" [formControl]="control" />`,
  imports: [CngxNumericInput, ReactiveFormsModule, CngxFormBridge],
})
class InitialValueHost {
  readonly control = new FormControl<number | null>(1234.5);
}

@Component({
  selector: 'numeric-rf-host-3',
  template: `<input cngxNumericInput [locale]="'de-DE'" [formControl]="control" />`,
  imports: [CngxNumericInput, ReactiveFormsModule, CngxFormBridge],
})
class DisabledHost {
  readonly control = new FormControl<number | null>({ value: null, disabled: true });
}

@Component({
  selector: 'numeric-rf-host-4',
  template: `
    <form [formGroup]="group">
      <input cngxNumericInput [locale]="'de-DE'" formControlName="amount" />
    </form>
  `,
  imports: [CngxNumericInput, ReactiveFormsModule, CngxFormBridge],
})
class GroupHost {
  readonly group = new FormGroup({ amount: new FormControl<number | null>(null) });
}

@Component({
  selector: 'numeric-rf-host-5',
  template: `<input cngxNumericInput [locale]="'de-DE'" [formField]="f.amount" />`,
  imports: [CngxNumericInput, FormField, ReactiveFormsModule, CngxFormBridge],
})
class SignalFormsHost {
  readonly model = signal<{ amount: number | null }>({ amount: null });
  readonly f = form(this.model);
}

@Component({
  selector: 'numeric-rf-host-8',
  template: `
    <form [formGroup]="group" (ngSubmit)="submitted.set(group.value.amount)">
      <input cngxNumericInput [locale]="'de-DE'" formControlName="amount" />
      <button type="submit">Save</button>
    </form>
  `,
  imports: [CngxNumericInput, ReactiveFormsModule, CngxFormBridge],
})
class SubmitHost {
  readonly group = new FormGroup({ amount: new FormControl<number | null>(null) });
  readonly submitted = signal<number | null | undefined>(undefined);
}

@Component({
  selector: 'numeric-rf-host-6',
  template: `<input cngxNumericInput [formControl]="control" />`,
  imports: [CngxNumericInput, ReactiveFormsModule],
})
class UnbridgedHost {
  readonly control = new FormControl<number | null>(null);
}

@Component({
  selector: 'numeric-rf-host-7',
  template: `<input cngxNumericInput />`,
  imports: [CngxNumericInput],
})
class StandaloneHost {}

function flush(fixture: ComponentFixture<unknown>): void {
  fixture.detectChanges();
  TestBed.flushEffects();
}

function mount<T>(host: Type<T>) {
  const fixture = TestBed.createComponent(host);
  flush(fixture);
  const debugInput = fixture.debugElement.query(By.css('input'));
  const input = debugInput.nativeElement as HTMLInputElement;
  const numeric = debugInput.injector.get(CngxNumericInput);
  return { fixture, input, numeric, debugInput, host: fixture.componentInstance };
}

function focus(input: HTMLInputElement, fixture: ComponentFixture<unknown>): void {
  input.focus();
  flush(fixture);
}

function blur(input: HTMLInputElement, fixture: ComponentFixture<unknown>): void {
  input.blur();
  flush(fixture);
}

function typeAndBlur(
  input: HTMLInputElement,
  text: string,
  fixture: ComponentFixture<unknown>,
): void {
  focus(input, fixture);
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  flush(fixture);
  blur(input, fixture);
}

function typeKey(input: HTMLInputElement, text: string): void {
  input.value = text;
  input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
}

function paste(input: HTMLInputElement, text: string): void {
  const event = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', { value: { getData: () => text } });
  input.dispatchEvent(event);
}

describe('CngxNumericInput under Reactive Forms', () => {
  it('harness sanity: typing plus blur sets the model', () => {
    const { fixture, input, numeric } = mount(RfHost);

    typeAndBlur(input, '1234,5', fixture);

    expect(numeric.value()).toBe(1234.5);
    expect(input.value).toBe('1.234,5');
  });

  it('A: typed text reaches the control as a number', () => {
    const { fixture, input, host } = mount(RfHost);

    typeAndBlur(input, '1234,5', fixture);

    expect(host.control.value).toBe(1234.5);
    expect(host.control.dirty).toBe(true);
  });

  it('A3: an in-range value survives focus plus blur without an emission', () => {
    const { fixture, input, host } = mount(InitialValueHost);
    let emissions = 0;
    host.control.valueChanges.subscribe(() => emissions++);

    focus(input, fixture);
    blur(input, fixture);

    expect(emissions).toBe(0);
    expect(host.control.value).toBe(1234.5);
    expect(host.control.pristine).toBe(true);
  });

  it.fails('typing without blur updates the control', () => {
    const { fixture, input, host } = mount(RfHost);
    focus(input, fixture);

    typeKey(input, '12');
    flush(fixture);

    expect(host.control.value).toBe(12);
    expect(host.control.dirty).toBe(true);
  });

  it.fails('Enter submit without blur reads the typed value', () => {
    const { fixture, input, host } = mount(SubmitHost);
    focus(input, fixture);

    typeKey(input, '1234,5');
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(host.submitted()).toBe(1234.5);
  });

  it.fails('Signal Forms: typing without blur updates the field', () => {
    const { fixture, input, host } = mount(SignalFormsHost);
    focus(input, fixture);

    typeKey(input, '12');
    flush(fixture);

    expect(host.model().amount).toBe(12);
  });

  it('B2: renders an initial control value and stays pristine', () => {
    const { input, numeric, host } = mount(InitialValueHost);

    expect(input.value).toBe('1.234,5');
    expect(numeric.value()).toBe(1234.5);
    expect(host.control.value).toBe(1234.5);
    expect(host.control.pristine).toBe(true);
  });

  it('C: paste and arrow keys reach the control', () => {
    const { fixture, input, host } = mount(RfHost);
    focus(input, fixture);

    paste(input, '42,5');
    flush(fixture);
    expect(host.control.value).toBe(42.5);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    flush(fixture);
    expect(host.control.value).toBe(43.5);
  });

  it('D2: setValue while blurred renders the formatted value and sets the model', () => {
    const { fixture, input, numeric, host } = mount(RfHost);

    host.control.setValue(1234.5);
    flush(fixture);

    expect(input.value).toBe('1.234,5');
    expect(numeric.value()).toBe(1234.5);
    expect(input.getAttribute('aria-valuenow')).toBe('1234.5');
  });

  it('D0: disables the input for a control created disabled', () => {
    const { input } = mount(DisabledHost);

    expect(input.disabled).toBe(true);
  });

  it('D: follows control.disable() and control.enable()', () => {
    const { fixture, input, host } = mount(RfHost);

    host.control.disable();
    flush(fixture);
    expect(input.disabled).toBe(true);

    host.control.enable();
    flush(fixture);
    expect(input.disabled).toBe(false);
  });

  it('E: marks the control touched on focusout', () => {
    const { fixture, input, host } = mount(RfHost);

    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    flush(fixture);

    expect(host.control.touched).toBe(true);
  });

  it('F: typed text reaches a formControlName inside a formGroup', () => {
    const { fixture, input, host } = mount(GroupHost);

    typeAndBlur(input, '1234,5', fixture);

    expect(host.group.value.amount).toBe(1234.5);
  });

  it('G: reset() after typing clears the view and aria-valuenow', () => {
    const { fixture, input, host } = mount(RfHost);
    typeAndBlur(input, '7', fixture);

    host.control.reset();
    expect(() => flush(fixture)).not.toThrow();

    expect(host.control.value).toBeNull();
    expect(input.value).toBe('');
    expect(input.getAttribute('aria-valuenow')).toBeNull();
  });

  it('SF: a [formField] host gets no value accessor and keeps binding the model', () => {
    const { fixture, input, debugInput, host } = mount(SignalFormsHost);

    expect(debugInput.injector.get(NG_VALUE_ACCESSOR, null, { self: true })).toBeNull();

    typeAndBlur(input, '99,25', fixture);

    expect(host.model().amount).toBe(99.25);
  });
});

describe('CngxNumericInput dev-mode accessor check', () => {
  function warnings(host: Type<unknown>): number {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      mount(host);
      return warn.mock.calls.filter(([msg]) => String(msg).startsWith('[cngxNumericInput]')).length;
    } finally {
      warn.mockRestore();
    }
  }

  it('warns once for [formControl] without CngxFormBridge', () => {
    expect(warnings(UnbridgedHost)).toBe(1);
  });

  it('stays silent with CngxFormBridge', () => {
    expect(warnings(RfHost)).toBe(0);
  });

  it('stays silent under [formField]', () => {
    expect(warnings(SignalFormsHost)).toBe(0);
  });

  it('stays silent on a standalone input', () => {
    expect(warnings(StandaloneHost)).toBe(0);
  });
});
