import { Component, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxFormField, CngxLabel } from '@cngx/forms/field';

import { CngxActionMultiSelect } from '../action-multi-select/action-multi-select.component';
import { CngxActionSelect } from '../action-select/action-select.component';
import { CngxCombobox } from '../combobox/combobox.component';
import { CngxTypeahead } from '../typeahead/typeahead.component';

interface InputVariant {
  readonly name: string;
  readonly component: Type<unknown>;
  readonly selector: string;
  readonly initial: string | string[] | null;
}

const VARIANTS: readonly InputVariant[] = [
  { name: 'CngxCombobox', component: CngxCombobox, selector: 'cngx-combobox', initial: [] },
  { name: 'CngxTypeahead', component: CngxTypeahead, selector: 'cngx-typeahead', initial: null },
  {
    name: 'CngxActionSelect',
    component: CngxActionSelect,
    selector: 'cngx-action-select',
    initial: null,
  },
  {
    name: 'CngxActionMultiSelect',
    component: CngxActionMultiSelect,
    selector: 'cngx-action-multi-select',
    initial: [],
  },
];

// The input-led selects carry their id on the `<input role="combobox">`
// only: a second copy on the host would win `label[for]` (first match in
// document order) and point the label at a non-labelable element.
describe.each(VARIANTS)('id contract ($name)', (variant) => {
  @Component({ template: '', imports: [] })
  class IdHost {
    readonly options = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ];
    readonly model = signal<{ pick: string | string[] | null }>({ pick: variant.initial });
    readonly f = form(this.model);
  }

  const mountedRoots: HTMLElement[] = [];
  afterEach(() => {
    mountedRoots.splice(0).forEach((el) => el.remove());
  });

  function mount(template: string) {
    TestBed.overrideComponent(IdHost, {
      set: { template, imports: [CngxFormField, CngxLabel, variant.component] },
    });
    const fixture = TestBed.createComponent(IdHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    mountedRoots.push(root);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const host = fixture.debugElement.query(By.directive(variant.component))
      .nativeElement as HTMLElement;
    const input = host.querySelector<HTMLInputElement>('input[role="combobox"]')!;
    return { root, host, input };
  }

  it('renders the field input id on exactly one element, the input', () => {
    const { root, host, input } = mount(`
      <cngx-form-field [field]="f.pick">
        <label cngxLabel>Pick</label>
        <${variant.selector} [options]="options" />
      </cngx-form-field>
    `);
    const label = root.querySelector<HTMLLabelElement>('label[cngxLabel]')!;
    expect(label.htmlFor).not.toBe('');
    expect(root.querySelectorAll(`[id="${label.htmlFor}"]`).length).toBe(1);
    expect(input.id).toBe(label.htmlFor);
    expect(host.hasAttribute('id')).toBe(false);
  });

  it('keeps a bound [id] on the input alone', () => {
    const { root, host, input } = mount(`
      <${variant.selector} [label]="'Pick'" [id]="'pick-input'" [options]="options" />
    `);
    expect(root.querySelectorAll('[id="pick-input"]').length).toBe(1);
    expect(input.id).toBe('pick-input');
    expect(host.hasAttribute('id')).toBe(false);
  });

  it('focuses the input when the field label is clicked', () => {
    const { root, input } = mount(`
      <cngx-form-field [field]="f.pick">
        <label cngxLabel>Pick</label>
        <${variant.selector} [options]="options" />
      </cngx-form-field>
    `);
    root.querySelector<HTMLLabelElement>('label[cngxLabel]')!.click();
    expect(document.activeElement).toBe(input);
  });
});
