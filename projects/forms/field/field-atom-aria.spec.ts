import { Component, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, FormField, required } from '@angular/forms/signals';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CngxCheckbox,
  CngxCheckboxGroup,
  CngxRadio,
  CngxRadioGroup,
  CngxToggle,
} from '@cngx/common/interactive';
import { CngxInput } from '@cngx/forms/input';

import { CngxFormField } from './form-field.component';
import { CngxHint } from './hint.directive';
import { CngxLabel } from './label.component';
import { CngxSuffix } from './suffix.directive';

// The field names and describes the control it discovered: a label `for`
// only on a labelable element, a click on the label focuses any other
// control, and the common atoms take the field's label, description, error
// message and required state. Only the discovered control takes them; an
// atom that merely sits in the field (an affix, the children of a group)
// does not.

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

function ids(el: Element, attr: string): string[] {
  return (el.getAttribute(attr) ?? '').split(/\s+/).filter(Boolean);
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('field atom aria - label for', () => {
  @Component({
    template: `
      <cngx-form-field [field]="f.email">
        <label cngxLabel>Email</label>
        <input cngxInput [formField]="f.email" />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxLabel, CngxInput, FormField],
  })
  class InputHost {
    readonly f = form(signal({ email: '' }));
  }

  it('points for at a labelable input', () => {
    const { el } = mount(InputHost);
    const label = el.querySelector('label')!;
    const input = el.querySelector('input')!;
    expect(input.id).not.toBe('');
    expect(label.getAttribute('for')).toBe(input.id);
  });

  @Component({
    template: `
      <cngx-form-field [field]="f.on">
        <label cngxLabel>Notifications</label>
        <cngx-toggle [(value)]="on" />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxLabel, CngxToggle],
  })
  class ToggleHost {
    readonly f = form(signal({ on: false }));
    readonly on = signal(false);
  }

  it('drops for on a non-labelable control and focuses it on a label click', () => {
    const { fixture, el } = mount(ToggleHost);
    const label = el.querySelector('label')!;
    const toggle = el.querySelector<HTMLElement>('cngx-toggle')!;
    expect(label.hasAttribute('for')).toBe(false);
    label.click();
    flush(fixture);
    expect(document.activeElement).toBe(toggle);
  });

  @Component({
    template: `
      <cngx-form-field [field]="f.email">
        <label cngxLabel>Email</label>
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxLabel],
  })
  class NoControlHost {
    readonly f = form(signal({ email: '' }));
  }

  it('warns once in development when the field discovers no control', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture, el } = mount(NoControlHost);
    flush(fixture);
    expect(el.querySelector('label')!.hasAttribute('for')).toBe(false);
    const calls = warn.mock.calls.filter((c) => /^CNGX2030: /.test(String(c[0])));
    expect(calls).toHaveLength(1);
    expect(String(calls[0][0])).toMatch(/^CNGX2030: \[cngxLabel\] /);
    warn.mockRestore();
  });
});

describe('field atom aria - the discovered atom takes the field aria', () => {
  @Component({
    template: `
      <cngx-form-field [field]="f.terms">
        <label cngxLabel>Terms</label>
        <cngx-checkbox [(value)]="terms">I agree</cngx-checkbox>
        <span cngxHint>Read them first.</span>
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxLabel, CngxCheckbox, CngxHint],
  })
  class CheckboxHost {
    readonly f = form(signal({ terms: false }), (p) => {
      required(p.terms);
    });
    readonly terms = signal(false);
  }

  it('checkbox: named by the field label and its own text, described, required, error message', () => {
    const { fixture, host, el } = mount(CheckboxHost);
    const box = el.querySelector('cngx-checkbox')!;
    const label = el.querySelector('label')!;
    const hint = el.querySelector('[cngxHint]')!;
    const labelledBy = ids(box, 'aria-labelledby');
    expect(labelledBy[0]).toBe(label.id);
    expect(labelledBy.length).toBe(2);
    expect(document.getElementById(labelledBy[1])!.textContent).toContain('I agree');
    expect(ids(box, 'aria-describedby')).toContain(hint.id);
    expect(box.getAttribute('aria-required')).toBe('true');
    expect(box.hasAttribute('aria-errormessage')).toBe(false);

    host.f.terms().markAsTouched();
    flush(fixture);
    expect(box.getAttribute('aria-invalid')).toBe('true');
    expect(box.getAttribute('aria-errormessage')).toMatch(/-error$/);
    expect(ids(box, 'aria-describedby')).toContain(box.getAttribute('aria-errormessage'));
  });

  @Component({
    template: `
      <cngx-form-field [field]="f.on">
        <label cngxLabel>Notifications</label>
        <cngx-toggle [(value)]="on">Email me</cngx-toggle>
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxLabel, CngxToggle],
  })
  class ToggleLabelHost {
    readonly f = form(signal({ on: false }));
    readonly on = signal(false);
  }

  it('toggle: the field label comes first in aria-labelledby, its own label second', () => {
    const { el } = mount(ToggleLabelHost);
    const toggle = el.querySelector('cngx-toggle')!;
    const labelledBy = ids(toggle, 'aria-labelledby');
    expect(labelledBy[0]).toBe(el.querySelector('label')!.id);
    expect(labelledBy.length).toBe(2);
    expect(document.getElementById(labelledBy[1])!.textContent).toContain('Email me');
  });

  @Component({
    template: `
      <cngx-form-field [field]="f.size">
        <label cngxLabel>Size</label>
        <cngx-radio-group [(value)]="size">
          <cngx-radio value="s">S</cngx-radio>
          <cngx-radio value="m">M</cngx-radio>
        </cngx-radio-group>
        <span cngxHint>Pick one.</span>
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxLabel, CngxRadioGroup, CngxRadio, CngxHint],
  })
  class RadioGroupHost {
    readonly f = form(signal({ size: '' }), (p) => {
      required(p.size);
    });
    readonly size = signal<string | undefined>(undefined);
  }

  it('radio group: described, required, error message after touch', () => {
    const { fixture, host, el } = mount(RadioGroupHost);
    const group = el.querySelector('cngx-radio-group')!;
    expect(ids(group, 'aria-describedby')).toContain(el.querySelector('[cngxHint]')!.id);
    expect(group.getAttribute('aria-required')).toBe('true');
    host.f.size().markAsTouched();
    flush(fixture);
    expect(group.getAttribute('aria-errormessage')).toMatch(/-error$/);
  });

  @Component({
    template: `
      <cngx-form-field [field]="f.tags">
        <label cngxLabel>Tags</label>
        <cngx-checkbox-group [(selectedValues)]="tags" [allValues]="all">
          <cngx-checkbox [value]="tags().includes('a')">A</cngx-checkbox>
          <cngx-checkbox [value]="tags().includes('b')">B</cngx-checkbox>
        </cngx-checkbox-group>
        <span cngxHint>Pick any.</span>
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxLabel, CngxCheckboxGroup, CngxCheckbox, CngxHint],
  })
  class CheckboxGroupHost {
    readonly f = form(signal({ tags: '' }), (p) => {
      required(p.tags);
    });
    readonly tags = signal<string[]>([]);
    readonly all = ['a', 'b'];
  }

  it('checkbox group: the group carries the field aria, its checkboxes do not', () => {
    const { fixture, host, el } = mount(CheckboxGroupHost);
    const group = el.querySelector('cngx-checkbox-group')!;
    const hintId = el.querySelector('[cngxHint]')!.id;
    expect(ids(group, 'aria-describedby')).toContain(hintId);
    expect(group.getAttribute('aria-required')).toBe('true');
    host.f.tags().markAsTouched();
    flush(fixture);
    expect(group.getAttribute('aria-errormessage')).toMatch(/-error$/);
    for (const box of Array.from(el.querySelectorAll('cngx-checkbox'))) {
      expect(ids(box, 'aria-describedby')).not.toContain(hintId);
      expect(box.hasAttribute('aria-errormessage')).toBe(false);
      expect(box.hasAttribute('aria-required')).toBe(false);
      expect(ids(box, 'aria-labelledby')).not.toContain(el.querySelector('label')!.id);
    }
  });

  @Component({
    template: `
      <cngx-form-field [field]="f.email">
        <label cngxLabel>Email</label>
        <input cngxInput [formField]="f.email" />
        <cngx-checkbox cngxSuffix [(value)]="remember">Remember</cngx-checkbox>
        <span cngxHint>Work address.</span>
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxLabel, CngxInput, FormField, CngxCheckbox, CngxSuffix, CngxHint],
  })
  class AffixHost {
    readonly f = form(signal({ email: '' }), (p) => {
      required(p.email);
    });
    readonly remember = signal(false);
  }

  it('an affix checkbox in a field takes none of the field aria', () => {
    const { fixture, host, el } = mount(AffixHost);
    host.f.email().markAsTouched();
    flush(fixture);
    const box = el.querySelector('cngx-checkbox')!;
    const hintId = el.querySelector('[cngxHint]')!.id;
    expect(ids(el.querySelector('input')!, 'aria-describedby')).toContain(hintId);
    expect(ids(box, 'aria-describedby')).not.toContain(hintId);
    expect(box.hasAttribute('aria-errormessage')).toBe(false);
    expect(box.hasAttribute('aria-required')).toBe(false);
    expect(ids(box, 'aria-labelledby')).not.toContain(el.querySelector('label')!.id);
  });
});
