import { Component, DestroyRef, inject, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { disabled, form, FormField, required, schema } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import {
  CngxListbox,
  CngxOption,
  CngxRangeSlider,
  CngxRangeSliderTrack,
  CngxSlider,
  CngxSliderTrack,
} from '@cngx/common/interactive';
import { CngxInput } from '@cngx/forms/input';
import { mousePick } from '@cngx/testing';

import { focusFirstError } from './focus-first-error';
import { adaptFormControl } from './form-control-adapter';
import { CngxFormErrors } from './form-errors.component';
import { CngxFormField } from './form-field.component';
import { CNGX_FORM_FIELD_REVEAL } from './form-field.token';
import { CngxLabel } from './label.component';
import { CngxListboxFieldBridge } from './listbox-field-bridge.directive';
import { CngxRangeSliderFieldBridge } from './range-slider-field-bridge.directive';
import { CngxSliderFieldBridge } from './slider-field-bridge.directive';

// Drives real Signal Forms `form()` trees and adapted Reactive Forms controls
// through the field, every bridge and the error summary. The mock-based unit
// specs cannot see drift between `createMockField` and `FieldState`.

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
  return { fixture, host: fixture.componentInstance, el: fixture.nativeElement as HTMLElement };
}

function summaryLinks(el: HTMLElement): HTMLElement[] {
  return Array.from(el.querySelectorAll<HTMLElement>('.cngx-form-errors a'));
}

describe('field integration - dirty after a user change', () => {
  @Component({
    template: `
      <cngx-form-field [field]="f.name">
        <label cngxLabel>Name</label>
        <input cngxInput [formField]="f.name" />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxLabel, CngxInput, FormField],
  })
  class InputHost {
    readonly f = form(signal({ name: '' }));
  }

  it('cngx-form-field + CngxInput: typing dirties the field', () => {
    const { fixture, host, el } = mount(InputHost);
    expect(host.f.name().dirty()).toBe(false);
    const input = el.querySelector('input')!;
    input.value = 'Ada';
    input.dispatchEvent(new Event('input'));
    flush(fixture);
    expect(host.f.name().dirty()).toBe(true);
    expect(el.querySelector('cngx-form-field')!.classList).toContain('cngx-field--dirty');
  });

  @Component({
    template: `
      <cngx-form-field [field]="f.volume">
        <cngx-slider cngxSliderFieldBridge [min]="0" [max]="100" aria-label="Volume" />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxSlider, CngxSliderFieldBridge],
  })
  class SliderHost {
    readonly f = form(signal({ volume: 40 }));
  }

  it('slider bridge: a user move dirties the field, the mount does not', () => {
    const { fixture, host } = mount(SliderHost);
    expect(host.f.volume().dirty()).toBe(false);
    fixture.debugElement
      .query(By.directive(CngxSlider))
      .injector.get(CngxSliderTrack)
      .value.set(65);
    flush(fixture);
    expect(host.f.volume().value()).toBe(65);
    expect(host.f.volume().dirty()).toBe(true);
  });

  @Component({
    template: `
      <cngx-form-field [field]="f.price">
        <cngx-range-slider cngxRangeSliderFieldBridge [min]="0" [max]="1000" aria-label="Price" />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxRangeSlider, CngxRangeSliderFieldBridge],
  })
  class RangeHost {
    readonly f = form(signal<{ price: [number, number] }>({ price: [100, 900] }));
  }

  it('range slider bridge: a user move dirties the field, the mount does not', () => {
    const { fixture, host } = mount(RangeHost);
    expect(host.f.price().dirty()).toBe(false);
    fixture.debugElement
      .query(By.directive(CngxRangeSlider))
      .injector.get(CngxRangeSliderTrack)
      .value.set([250, 750]);
    flush(fixture);
    expect(host.f.price().value()).toEqual([250, 750]);
    expect(host.f.price().dirty()).toBe(true);
  });

  @Component({
    template: `
      <cngx-form-field [field]="field">
        <div cngxListbox cngxListboxFieldBridge [label]="'Tags'" [multiple]="true" tabindex="0">
          <div cngxOption value="a">A</div>
          <div cngxOption value="b">B</div>
        </div>
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxListbox, CngxListboxFieldBridge, CngxOption],
  })
  class AdaptedListboxHost {
    readonly control = new FormControl<string[] | undefined>(undefined);
    readonly field = adaptFormControl(this.control, 'tags', inject(DestroyRef));
  }

  it('adapted Reactive Forms + listbox bridge: the mount seed keeps the control pristine, a pick dirties it', () => {
    const { fixture, host, el } = mount(AdaptedListboxHost);
    expect(host.control.value).toEqual([]);
    expect(host.control.dirty).toBe(false);

    mousePick(el.querySelectorAll<HTMLElement>('[role="option"]')[1]);
    flush(fixture);
    expect(host.control.value).toEqual(['b']);
    expect(host.control.dirty).toBe(true);
  });
});

describe('field integration - disabled listbox field', () => {
  @Component({
    template: `
      <cngx-form-field [field]="f.color">
        <div cngxListbox cngxListboxFieldBridge [label]="'Color'" tabindex="0">
          <div cngxOption value="red">Red</div>
          <div cngxOption value="blue">Blue</div>
        </div>
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxListbox, CngxListboxFieldBridge, CngxOption],
  })
  class DisabledListboxHost {
    readonly locked = signal(true);
    readonly f = form(
      signal({ color: 'red' }),
      schema<{ color: string }>((p) => {
        disabled(p.color, () => this.locked());
      }),
    );
  }

  it('rejects a click and keeps the field value while the schema disables it', () => {
    const { fixture, host, el } = mount(DisabledListboxHost);
    const listbox = el.querySelector<HTMLElement>('[role="listbox"]')!;
    expect(listbox.getAttribute('aria-disabled')).toBe('true');

    mousePick(el.querySelectorAll<HTMLElement>('[role="option"]')[1]);
    flush(fixture);
    expect(host.f.color().value()).toBe('red');
    expect(host.f.color().dirty()).toBe(false);

    host.locked.set(false);
    flush(fixture);
    mousePick(el.querySelectorAll<HTMLElement>('[role="option"]')[1]);
    flush(fixture);
    expect(host.f.color().value()).toBe('blue');
  });
});

describe('field integration - summary links focus the control', () => {
  @Component({
    template: `
      <cngx-form-errors [fields]="[f.email]" [show]="true" />
      <cngx-form-field [field]="f.email">
        <label cngxLabel>Email</label>
        <input cngxInput [formField]="f.email" />
      </cngx-form-field>
    `,
    imports: [CngxFormErrors, CngxFormField, CngxLabel, CngxInput, FormField],
  })
  class FormFieldSummaryHost {
    readonly f = form(
      signal({ email: '' }),
      schema<{ email: string }>((p) => {
        required(p.email);
      }),
    );
  }

  @Component({
    template: `
      <cngx-form-errors [fields]="[field]" [show]="true" />
      <cngx-form-field [field]="field">
        <label cngxLabel>Email</label>
        <input cngxInput [formControl]="control" />
      </cngx-form-field>
    `,
    imports: [CngxFormErrors, CngxFormField, CngxLabel, CngxInput, ReactiveFormsModule],
  })
  class AdaptedSummaryHost {
    readonly control = new FormControl('', Validators.required);
    readonly field = adaptFormControl(this.control, 'email', inject(DestroyRef));
  }

  @Component({
    template: `
      <cngx-form-errors [fields]="[f.color]" [show]="true" />
      <cngx-form-field [field]="f.color">
        <label cngxLabel>Color</label>
        <div cngxListbox cngxListboxFieldBridge [label]="'Color'" tabindex="0">
          <div cngxOption value="red">Red</div>
        </div>
      </cngx-form-field>
    `,
    imports: [
      CngxFormErrors,
      CngxFormField,
      CngxLabel,
      CngxListbox,
      CngxListboxFieldBridge,
      CngxOption,
    ],
  })
  class ListboxSummaryHost {
    readonly f = form(
      signal({ color: '' }),
      schema<{ color: string }>((p) => {
        required(p.color);
      }),
    );
  }

  const cases = [
    { name: '[formField] input', type: FormFieldSummaryHost, target: 'input' },
    { name: 'adapted Reactive Forms input', type: AdaptedSummaryHost, target: 'input' },
    { name: 'listbox bridge', type: ListboxSummaryHost, target: '[role="listbox"]' },
  ] as const;

  for (const { name, type, target } of cases) {
    it(`${name}: click on the summary link focuses the control`, () => {
      const { el } = mount<unknown>(type);
      const [link] = summaryLinks(el);
      expect(link).toBeTruthy();
      link.focus();
      link.click();
      expect(document.activeElement).toBe(el.querySelector(target));
    });

    it(`${name}: Enter on the summary link focuses the control`, () => {
      const { el } = mount<unknown>(type);
      const [link] = summaryLinks(el);
      link.focus();
      link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(document.activeElement).toBe(el.querySelector(target));
    });
  }
});

describe('field integration - focusFirstError', () => {
  @Component({
    template: `
      <input id="a" [formField]="f.a" />
      <input id="b" [formField]="f.b" />
    `,
    imports: [FormField],
  })
  class DomDisabledHost {
    readonly f = form(
      signal({ a: '', b: '' }),
      schema<{ a: string; b: string }>((p) => {
        required(p.a);
        required(p.b);
      }),
    );
  }

  it('skips a control that does not take focus and reaches the next invalid one', () => {
    const { host, el } = mount(DomDisabledHost);
    // Disabled in the DOM only (a consumer attribute), the schema keeps it enabled.
    el.querySelector('#a')!.setAttribute('disabled', '');
    expect(focusFirstError(host.f)).toBe(true);
    expect(document.activeElement).toBe(el.querySelector('#b'));
  });
});

describe('field integration - reveal provided by an ancestor', () => {
  const submitted = signal(false);

  @Component({
    template: `
      <cngx-form-field [field]="f.name">
        <label cngxLabel>Name</label>
        <input cngxInput [formField]="f.name" />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxLabel, CngxInput, FormField],
    providers: [{ provide: CNGX_FORM_FIELD_REVEAL, useValue: { showErrors: submitted } }],
  })
  class AncestorRevealHost {
    readonly f = form(
      signal({ name: '' }),
      schema<{ name: string }>((p) => {
        required(p.name);
      }),
    );
  }

  it('reveals the errors of an untouched invalid field when the ancestor reveal flips', () => {
    submitted.set(false);
    const { fixture, host, el } = mount(AncestorRevealHost);
    const field = el.querySelector('cngx-form-field')!;
    expect(host.f.name().touched()).toBe(false);
    expect(field.classList).not.toContain('cngx-field--error');

    submitted.set(true);
    flush(fixture);
    expect(field.classList).toContain('cngx-field--error');
  });
});
