import { Component, type Type, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { CngxFormBridge } from '@cngx/forms/controls';
import { describe, expect, it } from 'vitest';
import { CngxInputMask } from './input-mask.directive';

@Component({
  selector: 'mask-rf-host-1',
  template: `<input cngxInputMask="00:00" [formControl]="control" />`,
  imports: [CngxInputMask, ReactiveFormsModule, CngxFormBridge],
})
class RfHost {
  readonly control = new FormControl('', { nonNullable: true, validators: [Validators.required] });
}

@Component({
  selector: 'mask-rf-host-2',
  template: `<input cngxInputMask="00:00" [formControl]="control" />`,
  imports: [CngxInputMask, ReactiveFormsModule, CngxFormBridge],
})
class InitialValueHost {
  readonly control = new FormControl('0915', { nonNullable: true });
}

@Component({
  selector: 'mask-rf-host-3',
  template: `<input cngxInputMask="00:00" [formControl]="control" />`,
  imports: [CngxInputMask, ReactiveFormsModule, CngxFormBridge],
})
class DisabledHost {
  readonly control = new FormControl({ value: '', disabled: true }, { nonNullable: true });
}

@Component({
  selector: 'mask-rf-host-4',
  template: `<input cngxInputMask="00:00" [formControl]="control" />`,
  imports: [CngxInputMask, ReactiveFormsModule, CngxFormBridge],
})
class NullableHost {
  readonly control = new FormControl<string | null>('1430');
}

@Component({
  selector: 'mask-rf-host-5',
  template: `
    <form [formGroup]="group">
      <input cngxInputMask="00:00" formControlName="at" />
    </form>
  `,
  imports: [CngxInputMask, ReactiveFormsModule, CngxFormBridge],
})
class GroupHost {
  readonly group = new FormGroup({ at: new FormControl('', { nonNullable: true }) });
}

@Component({
  selector: 'mask-rf-host-6',
  template: `<input [cngxInputMask]="pattern()" [formControl]="control" />`,
  imports: [CngxInputMask, ReactiveFormsModule, CngxFormBridge],
})
class PatternSwitchHost {
  readonly pattern = signal('00:00');
  readonly control = new FormControl('', { nonNullable: true });
}

@Component({
  selector: 'mask-rf-host-7',
  template: `<input cngxInputMask="00:00" [formField]="f.at" />`,
  imports: [CngxInputMask, FormField, ReactiveFormsModule, CngxFormBridge],
})
class SignalFormsHost {
  readonly model = signal({ at: '' });
  readonly f = form(this.model);
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
  const mask = debugInput.injector.get(CngxInputMask);
  return { fixture, input, mask, debugInput, host: fixture.componentInstance };
}

function type(input: HTMLInputElement, chars: string, fixture: ComponentFixture<unknown>): void {
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

describe('CngxInputMask under Reactive Forms', () => {
  it('harness sanity: renders the guide and accepts typed slots', () => {
    const { fixture, input, mask } = mount(RfHost);
    expect(input.value).toBe('__:__');

    type(input, '1430', fixture);

    expect(input.value).toBe('14:30');
    expect(mask.value()).toBe('1430');
    expect(() => mount(DisabledHost)).not.toThrow();
  });

  it('A: typed text reaches the control as the raw value', () => {
    const { fixture, input, host } = mount(RfHost);

    type(input, '1430', fixture);

    expect(host.control.value).toBe('1430');
    expect(host.control.dirty).toBe(true);
  });

  it('B1: keeps an empty control empty and pristine after the first render', () => {
    const { host } = mount(RfHost);

    expect(host.control.value).toBe('');
    expect(host.control.pristine).toBe(true);
    expect(host.control.hasError('required')).toBe(true);
  });

  it('B2: renders an initial control value into the mask', () => {
    const { input, mask, host } = mount(InitialValueHost);

    expect(input.value).toBe('09:15');
    expect(mask.value()).toBe('0915');
    expect(host.control.value).toBe('0915');
  });

  it('C1: setValue writes through the mask and emits once', () => {
    const { fixture, input, mask, host } = mount(RfHost);
    let emissions = 0;
    host.control.valueChanges.subscribe(() => emissions++);

    host.control.setValue('1430');
    flush(fixture);

    expect(input.value).toBe('14:30');
    expect(mask.value()).toBe('1430');
    expect(emissions).toBe(1);
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

    type(input, '1430', fixture);

    expect(host.group.value.at).toBe('1430');
  });

  it('G1: survives reset() on a nullable control', () => {
    const empty = mount(RfHost).input.value;
    const { fixture, input, host } = mount(NullableHost);
    expect(input.value).toBe('14:30');

    host.control.reset();
    expect(() => flush(fixture)).not.toThrow();

    expect(input.value).toBe(empty);
    expect(host.control.value).toBeNull();
  });

  it('G2: renders a numeric setValue without throwing', () => {
    const { fixture, input, host } = mount(RfHost);

    host.control.setValue(1430 as unknown as string);
    expect(() => flush(fixture)).not.toThrow();

    expect(input.value).toBe('14:30');
  });

  it('H: the mask-change auto-clear reaches the control', () => {
    const { fixture, input, host } = mount(PatternSwitchHost);
    type(input, '1430', fixture);

    host.pattern.set('0000-0000');
    flush(fixture);

    expect(host.control.value).toBe('');
  });

  it('SF: a [formField] host gets no value accessor and keeps binding the model', () => {
    const { fixture, input, debugInput, host } = mount(SignalFormsHost);

    expect(debugInput.injector.get(NG_VALUE_ACCESSOR, null, { self: true })).toBeNull();

    type(input, '1430', fixture);

    expect(host.model().at).toBe('1430');
  });
});
