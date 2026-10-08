import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, required, schema } from '@angular/forms/signals';
import { CngxFieldErrors, CngxFormField, CngxLabel } from '@cngx/forms/field';
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
    }),
  );
}

function setup() {
  const fixture = TestBed.createComponent(SignalFormsHost);
  fixture.detectChanges();
  TestBed.flushEffects();
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  return { fixture, input, host: fixture.componentInstance };
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
