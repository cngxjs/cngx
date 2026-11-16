import { Component, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, FormField, required, schema } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CngxInput } from '@cngx/forms/input';

import { CngxError } from './error.directive';
import { CngxFieldErrors } from './field-errors.component';
import { CngxFormErrors } from './form-errors.component';
import { CngxFormField } from './form-field.component';
import { provideFormFieldAt, withRequiredMarker } from './form-field.token';
import { CngxLabel } from './label.component';
import { createMockField, mockValidationError } from './testing/mock-field';

// The error regions keep one shape from the first render: a static polite
// status region, never aria-hidden, only the content changes. The summary
// names each field by the label text the presenter publishes, so a summary
// rendered above its fields names them on the first render too.

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

function regionShape(el: Element) {
  return {
    role: el.getAttribute('role'),
    live: el.getAttribute('aria-live'),
    hidden: el.getAttribute('aria-hidden'),
  };
}

const STATUS = { role: 'status', live: 'polite', hidden: null };

afterEach(() => {
  document.body.innerHTML = '';
});

describe('field error regions - stable live region', () => {
  @Component({
    template: `
      <cngx-form-field [field]="f.name">
        <label cngxLabel>Name</label>
        <input cngxInput [formField]="f.name" />
        <cngx-field-errors />
      </cngx-form-field>
      <cngx-form-field [field]="f.city">
        <label cngxLabel>City</label>
        <input cngxInput [formField]="f.city" />
        <div cngxError #err="cngxError">
          @if (err.visible()) {
            <span>City is required.</span>
          }
        </div>
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxLabel, CngxInput, FormField, CngxFieldErrors, CngxError],
  })
  class RegionHost {
    readonly f = form(
      signal({ name: '', city: '' }),
      schema<{ name: string; city: string }>((p) => {
        required(p.name);
        required(p.city);
      }),
    );
  }

  it('cngx-field-errors is a polite status region before and after the errors show', () => {
    const { fixture, host, el } = mount(RegionHost);
    const region = el.querySelector('cngx-field-errors')!;
    expect(regionShape(region)).toEqual(STATUS);
    host.f.name().markAsTouched();
    flush(fixture);
    expect(regionShape(region)).toEqual(STATUS);
    expect(region.textContent).toContain('required');
  });

  it('cngxError is a polite status region and exposes visible', () => {
    const { fixture, host, el } = mount(RegionHost);
    const region = el.querySelector('[cngxError]')!;
    const error = fixture.debugElement.query(By.directive(CngxError)).injector.get(CngxError);
    expect(regionShape(region)).toEqual(STATUS);
    expect(error.visible()).toBe(false);
    expect(region.textContent?.trim()).toBe('');
    host.f.city().markAsTouched();
    flush(fixture);
    expect(regionShape(region)).toEqual(STATUS);
    expect(error.visible()).toBe(true);
    expect(region.textContent).toContain('City is required.');
  });
});

describe('field error regions - repeated error kinds', () => {
  @Component({
    template: `
      <cngx-form-field [field]="mock.accessor">
        <label cngxLabel>Code</label>
        <input cngxInput />
        <cngx-field-errors />
      </cngx-form-field>
      <cngx-form-errors [fields]="[mock.accessor]" [show]="true" />
    `,
    imports: [CngxFormField, CngxLabel, CngxInput, CngxFieldErrors, CngxFormErrors],
  })
  class RepeatHost {
    readonly mock = createMockField({
      name: 'code',
      invalid: true,
      touched: true,
      errors: [
        mockValidationError('server', 'Code is taken.'),
        mockValidationError('server', 'Code is reserved.'),
      ],
    });
  }

  it('renders both messages of one kind without a duplicate track key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { el } = mount(RepeatHost);
    expect(el.querySelectorAll('cngx-field-errors p')).toHaveLength(2);
    expect(el.querySelectorAll('cngx-form-errors li')).toHaveLength(2);
    const ng0955 = [...warn.mock.calls, ...error.mock.calls].filter((c) =>
      String(c[0]).includes('NG0955'),
    );
    expect(ng0955).toHaveLength(0);
    warn.mockRestore();
    error.mockRestore();
  });
});

describe('field error regions - summary labels', () => {
  type Model = { a: string; b: string };

  @Component({
    template: `
      <cngx-form-errors [fields]="[f.a, f.b]" [show]="true" />
      <cngx-form-field [field]="f.a">
        <label cngxLabel>Alpha</label>
        <input cngxInput [formField]="f.a" />
      </cngx-form-field>
      <cngx-form-field [field]="f.b">
        <label cngxLabel>Beta</label>
        <input cngxInput [formField]="f.b" />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxLabel, CngxInput, CngxFormErrors, FormField],
    providers: [provideFormFieldAt(withRequiredMarker())],
  })
  class SummaryTopHost {
    readonly f = form(
      signal<Model>({ a: '', b: '' }),
      schema<Model>((r) => {
        required(r.a);
        required(r.b);
      }),
    );
  }

  it('names the fields when the summary renders above them, without the required marker', () => {
    const { el } = mount(SummaryTopHost);
    const items = Array.from(el.querySelectorAll('cngx-form-errors li')).map((li) =>
      li.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(items).toHaveLength(2);
    expect(items[0]).toMatch(/^Alpha: /);
    expect(items[1]).toMatch(/^Beta: /);
  });

  it('the summary is a polite status region from the first render', () => {
    const { el } = mount(SummaryTopHost);
    expect(regionShape(el.querySelector('cngx-form-errors')!)).toEqual(STATUS);
  });
});
