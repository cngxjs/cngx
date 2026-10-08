import { Component, type Type, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { CngxFormBridge } from '@cngx/forms/controls';
import { describe, expect, it, vi } from 'vitest';
import { CngxInputFormat, type FormatFn, type ParseFn } from './input-format.directive';

const formatDollar: FormatFn = (raw) => (raw ? `$${raw}` : '');
const parseDollar: ParseFn = (display) => display.replace(/^\$/, '');

@Component({
  selector: 'format-rf-host-1',
  template: `<input [cngxInputFormat]="format" [parse]="parse" [formControl]="control" />`,
  imports: [CngxInputFormat, ReactiveFormsModule, CngxFormBridge],
})
class RfHost {
  readonly format = formatDollar;
  readonly parse = parseDollar;
  readonly control = new FormControl('', { nonNullable: true });
}

@Component({
  selector: 'format-rf-host-2',
  template: `<input [cngxInputFormat]="format" [parse]="parse" [formControl]="control" />`,
  imports: [CngxInputFormat, ReactiveFormsModule, CngxFormBridge],
})
class InitialValueHost {
  readonly format = formatDollar;
  readonly parse = parseDollar;
  readonly control = new FormControl('100', { nonNullable: true });
}

@Component({
  selector: 'format-rf-host-3',
  template: `<input [cngxInputFormat]="format" [parse]="parse" [formControl]="control" />`,
  imports: [CngxInputFormat, ReactiveFormsModule, CngxFormBridge],
})
class DisabledHost {
  readonly format = formatDollar;
  readonly parse = parseDollar;
  readonly control = new FormControl({ value: '', disabled: true }, { nonNullable: true });
}

@Component({
  selector: 'format-rf-host-4',
  template: `<input [cngxInputFormat]="format" [parse]="parse" [formControl]="control" />`,
  imports: [CngxInputFormat, ReactiveFormsModule, CngxFormBridge],
})
class NullableHost {
  readonly format = formatDollar;
  readonly parse = parseDollar;
  readonly control = new FormControl<string | null>('100');
}

@Component({
  selector: 'format-rf-host-5',
  template: `<input [cngxInputFormat]="format" [parse]="parse" [formField]="f.amount" />`,
  imports: [CngxInputFormat, FormField, ReactiveFormsModule, CngxFormBridge],
})
class SignalFormsHost {
  readonly format = formatDollar;
  readonly parse = parseDollar;
  readonly model = signal({ amount: '100' });
  readonly f = form(this.model);
}

@Component({
  selector: 'format-rf-host-6',
  template: `<input [cngxInputFormat]="format" [formControl]="control" />`,
  imports: [CngxInputFormat, ReactiveFormsModule],
})
class UnbridgedHost {
  readonly format = formatDollar;
  readonly control = new FormControl('', { nonNullable: true });
}

@Component({
  selector: 'format-rf-host-7',
  template: `<input [cngxInputFormat]="format" />`,
  imports: [CngxInputFormat],
})
class StandaloneHost {
  readonly format = formatDollar;
}

function flush(fixture: ComponentFixture<unknown>): void {
  fixture.detectChanges();
  TestBed.flushEffects();
}

function mount<T>(host: Type<T>) {
  const fixture = TestBed.createComponent(host);
  flush(fixture);
  const debugInput = fixture.debugElement.query(By.css('input'));
  const input = debugInput.nativeElement as HTMLInputElement;
  const formatDir = debugInput.injector.get(CngxInputFormat);
  return { fixture, input, formatDir, debugInput, host: fixture.componentInstance };
}

function focus(input: HTMLInputElement, fixture: ComponentFixture<unknown>): void {
  input.focus();
  flush(fixture);
}

function blur(input: HTMLInputElement, fixture: ComponentFixture<unknown>): void {
  input.blur();
  flush(fixture);
}

function typeText(input: HTMLInputElement, text: string, fixture: ComponentFixture<unknown>): void {
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  flush(fixture);
}

describe('CngxInputFormat under Reactive Forms', () => {
  it('harness sanity: typing plus blur sets the raw model and the formatted view', () => {
    const { fixture, input, formatDir } = mount(RfHost);

    focus(input, fixture);
    typeText(input, '250', fixture);
    blur(input, fixture);

    expect(formatDir.value()).toBe('250');
    expect(input.value).toBe('$250');
  });

  it('A: the control holds the raw value after typing and blur', () => {
    const { fixture, input, host } = mount(RfHost);

    focus(input, fixture);
    typeText(input, '250', fixture);
    blur(input, fixture);

    expect(host.control.value).toBe('250');
    expect(host.control.dirty).toBe(true);
  });

  it('A2: blur and refocus neither change the control nor emit', () => {
    const { fixture, input, host } = mount(RfHost);
    focus(input, fixture);
    typeText(input, '250', fixture);
    let emissions = 0;
    host.control.valueChanges.subscribe(() => emissions++);

    blur(input, fixture);
    focus(input, fixture);
    blur(input, fixture);

    expect(emissions).toBe(0);
    expect(host.control.value).toBe('250');
  });

  it('B2: renders an initial control value formatted and stays pristine', () => {
    const { input, formatDir, host } = mount(InitialValueHost);

    expect(input.value).toBe('$100');
    expect(formatDir.value()).toBe('100');
    expect(host.control.value).toBe('100');
    expect(host.control.pristine).toBe(true);
  });

  it('C: setValue renders the formatted value and sets the model', () => {
    const { fixture, input, formatDir, host } = mount(RfHost);

    host.control.setValue('77');
    flush(fixture);

    expect(input.value).toBe('$77');
    expect(formatDir.value()).toBe('77');
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

  it('G: reset() after typing renders an empty field without throwing', () => {
    const { fixture, input, formatDir, host } = mount(NullableHost);
    focus(input, fixture);
    typeText(input, '9', fixture);
    blur(input, fixture);

    host.control.reset();
    expect(() => flush(fixture)).not.toThrow();

    expect(host.control.value).toBeNull();
    expect(input.value).toBe('');
    expect(formatDir.displayValue()).toBe('');
  });

  it('G2: focus and blur on a reset control keep it null and pristine', () => {
    const { fixture, input, host } = mount(NullableHost);
    host.control.reset();
    flush(fixture);

    focus(input, fixture);
    blur(input, fixture);

    expect(host.control.value).toBeNull();
    expect(host.control.pristine).toBe(true);
  });

  it('SF: a [formField] host gets no value accessor and keeps the model raw', () => {
    const { fixture, input, debugInput, host } = mount(SignalFormsHost);

    expect(debugInput.injector.get(NG_VALUE_ACCESSOR, null, { self: true })).toBeNull();
    expect(input.value).toBe('$100');

    focus(input, fixture);
    expect(host.model().amount).toBe('100');

    typeText(input, '300', fixture);
    blur(input, fixture);

    expect(host.model().amount).toBe('300');
    expect(input.value).toBe('$300');
  });
});

describe('CngxInputFormat dev-mode accessor check', () => {
  function warnings(host: Type<unknown>): number {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      mount(host);
      return warn.mock.calls.filter(([msg]) => String(msg).startsWith('[cngxInputFormat]')).length;
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
