import { Component, type Type, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { form } from '@angular/forms/signals';
import { CngxFormBridge } from '@cngx/forms/controls';
import { CngxFormField } from '@cngx/forms/field';
import { CngxSelect } from '@cngx/forms/select';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadAllMaskPresets } from '../mask-presets/registry';
import { CngxPhoneInput } from './phone-input.component';

@Component({
  selector: 'phone-sf-host-1',
  template: `<cngx-form-field [field]="f.phone"><cngx-phone-input /></cngx-form-field>`,
  imports: [CngxPhoneInput, CngxFormField],
})
class SignalFormsHost {
  readonly model = signal({ phone: '' });
  readonly f = form(this.model);
}

@Component({
  selector: 'phone-rf-host-1',
  template: `<cngx-phone-input [formControl]="control" />`,
  imports: [CngxPhoneInput, ReactiveFormsModule, CngxFormBridge],
})
class RfHost {
  readonly control = new FormControl('', { nonNullable: true });
}

@Component({
  selector: 'phone-rf-host-2',
  template: `<cngx-phone-input [formControl]="control" />`,
  imports: [CngxPhoneInput, ReactiveFormsModule, CngxFormBridge],
})
class NullableHost {
  readonly control = new FormControl<string | null>('12025550123');
}

function flush(fixture: ComponentFixture<unknown>): void {
  fixture.detectChanges();
  TestBed.flushEffects();
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  flush(fixture);
  await Promise.resolve();
  flush(fixture);
}

async function mount<T>(host: Type<T>) {
  const fixture = TestBed.createComponent(host);
  document.body.appendChild(fixture.nativeElement);
  await settle(fixture);
  const input = fixture.debugElement.query(By.css('input.cngx-phone-input__number'))
    .nativeElement as HTMLInputElement;
  const phone = fixture.debugElement.query(By.directive(CngxPhoneInput))
    .componentInstance as CngxPhoneInput;
  const select = fixture.debugElement.query(By.directive(CngxSelect));
  const trigger = (select.nativeElement as HTMLElement).querySelector<HTMLElement>(
    '.cngx-select__trigger',
  )!;
  return { fixture, input, phone, select, trigger, host: fixture.componentInstance };
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

function digits(input: HTMLInputElement): string {
  return input.value.replace(/\D/g, '');
}

function leave(from: HTMLElement, to: HTMLElement | null, fixture: ComponentFixture<unknown>): void {
  from.dispatchEvent(new FocusEvent('blur', { relatedTarget: to }));
  from.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: to }));
  flush(fixture);
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('CngxPhoneInput under Reactive Forms', () => {
  beforeAll(async () => {
    await loadAllMaskPresets();
  });

  it('harness sanity: a Signal Forms host mounts and typed digits reach the model', async () => {
    const { fixture, input, host } = await mount(SignalFormsHost);

    type(input, '2025550123', fixture);

    expect(host.model().phone).toBe('12025550123');
  });

  it.fails('P0: a Signal Forms field stays empty after load while the dial code shows', async () => {
    const { input, host } = await mount(SignalFormsHost);

    expect(host.model().phone).toBe('');
    expect(host.f.phone().dirty()).toBe(false);
    expect(digits(input)).toBe('1');
  });

  it.fails('P1: a [formControl] host mounts', async () => {
    await expect(mount(RfHost)).resolves.toBeDefined();
  });

  it.fails('P2: the control stays empty and pristine after load', async () => {
    const { input, host } = await mount(RfHost);

    expect(host.control.value).toBe('');
    expect(host.control.pristine).toBe(true);
    expect(digits(input)).toBe('1');
  });

  it.fails('P3: typed digits reach the control', async () => {
    const { fixture, input, host } = await mount(RfHost);

    type(input, '2025550123', fixture);

    expect(host.control.value).toBe('12025550123');
    expect(host.control.dirty).toBe(true);
  });

  it.fails('P4: setValue renders into the mask', async () => {
    const { fixture, input, phone, host } = await mount(RfHost);

    host.control.setValue('12025550123');
    await settle(fixture);

    expect(phone.value()).toBe('12025550123');
    expect(digits(input)).toBe('12025550123');
  });

  it.fails('P5: reset() on a nullable control renders the dial code without throwing', async () => {
    const { fixture, input, host } = await mount(NullableHost);
    expect(digits(input)).toBe('12025550123');

    host.control.reset();
    await expect(settle(fixture)).resolves.toBeUndefined();

    expect(host.control.value).toBeNull();
    expect(digits(input)).toBe('1');
  });

  it.fails('P6: disable() disables the inner input and the country picker', async () => {
    const { fixture, input, phone, select, host } = await mount(RfHost);

    host.control.disable();
    flush(fixture);

    expect(phone.disabled()).toBe(true);
    expect(input.disabled).toBe(true);
    expect(select.injector.get(CngxSelect).disabled()).toBe(true);

    host.control.enable();
    flush(fixture);
    expect(input.disabled).toBe(false);
  });

  it.fails('P7: touched only when focus leaves the host', async () => {
    const { fixture, input, trigger, host } = await mount(RfHost);

    leave(input, trigger, fixture);
    expect(host.control.touched).toBe(false);

    leave(trigger, null, fixture);
    expect(host.control.touched).toBe(true);
  });
});

describe('CngxPhoneInput touched inside cngx-form-field', () => {
  beforeAll(async () => {
    await loadAllMaskPresets();
  });

  it.fails('T1: moving from the number field to the country picker leaves the field untouched', async () => {
    const { fixture, input, trigger, host } = await mount(SignalFormsHost);

    leave(input, trigger, fixture);

    expect(host.f.phone().touched()).toBe(false);
  });

  it.fails('T2: leaving after only the country picker was used marks the field touched', async () => {
    const { fixture, trigger, host } = await mount(SignalFormsHost);

    leave(trigger, null, fixture);

    expect(host.f.phone().touched()).toBe(true);
  });
});
