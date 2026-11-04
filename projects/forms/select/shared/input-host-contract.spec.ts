import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';

import { CngxFormField } from '@cngx/forms/field';
import type { CngxFieldAccessor } from '@cngx/forms/field';
import { createMockField } from '@cngx/forms/field/testing';
import { CNGX_NESTED_INTERACTIVE_SELECTOR } from '@cngx/core/utils';

import { CngxActionMultiSelect } from '../action-multi-select/action-multi-select.component';
import { CngxActionSelect } from '../action-select/action-select.component';
import { CngxCombobox } from '../combobox/combobox.component';
import { CngxTypeahead } from '../typeahead/typeahead.component';

import { KINDS, cleanupRoots, mount } from './__test-helpers/review-probe-host';

afterEach(() => {
  cleanupRoots();
  vi.restoreAllMocks();
});

function flush(fixture: ComponentFixture<unknown>): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

// ── C3: readonly is enforced natively, not only via aria-readonly ──────────
const INPUT_COMPOSITES: readonly { name: string; component: Type<unknown>; selector: string; model: 'value' | 'values' }[] = [
  { name: 'CngxCombobox', component: CngxCombobox, selector: 'cngx-combobox', model: 'values' },
  { name: 'CngxTypeahead', component: CngxTypeahead, selector: 'cngx-typeahead', model: 'value' },
  { name: 'CngxActionSelect', component: CngxActionSelect, selector: 'cngx-action-select', model: 'value' },
  { name: 'CngxActionMultiSelect', component: CngxActionMultiSelect, selector: 'cngx-action-multi-select', model: 'values' },
];

describe('C3: readonly input hosts', () => {
  const roots: HTMLElement[] = [];
  afterEach(() => roots.splice(0).forEach((el) => el.remove()));

  for (const variant of INPUT_COMPOSITES) {
    it(`${variant.name}: a readonly field sets aria-readonly`, () => {
      const input = mountReadonly(variant, roots);
      expect(input.getAttribute('aria-readonly')).toBe('true');
    });

    it.fails(`${variant.name}: a readonly field sets the native readonly attribute`, () => {
      const input = mountReadonly(variant, roots);
      expect(input.hasAttribute('readonly')).toBe(true);
    });
  }
});

function mountReadonly(
  variant: (typeof INPUT_COMPOSITES)[number],
  roots: HTMLElement[],
): HTMLInputElement {
  @Component({ template: '', imports: [] })
  class Host {
    readonly options = signal([{ value: 'red', label: 'Red' }]);
    readonly field: CngxFieldAccessor<unknown> = createMockField<unknown>({
      name: 'colour',
      readonly: true,
      value: variant.model === 'value' ? 'red' : ['red'],
    }).accessor;
  }
  TestBed.overrideComponent(Host, {
    set: {
      template: `
        <cngx-form-field [field]="field">
          <${variant.selector} [label]="'Colour'" [options]="options()" />
        </cngx-form-field>
      `,
      imports: [CngxFormField, variant.component],
    },
  });
  const fixture = TestBed.createComponent(Host);
  const root = fixture.nativeElement as HTMLElement;
  document.body.appendChild(root);
  roots.push(root);
  fixture.detectChanges();
  flush(fixture);
  return root.querySelector<HTMLInputElement>('input')!;
}

// ── A24: a blur into the panel (Retry) keeps the typed term ────────────────
describe('A24: typeahead keeps the typed term on a blur into its own panel', () => {
  it.fails('does not snap the input back when focus moves to a node inside the component', () => {
    const m = mount(KINDS['typeahead']);
    m.open();
    const input = m.el.querySelector<HTMLInputElement>('input')!;
    input.value = 'xyz';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    m.settle();
    const inside = (m.el.querySelector('.cngx-select__panel') ?? m.el) as HTMLElement;
    input.dispatchEvent(new FocusEvent('blur', { relatedTarget: inside }));
    m.settle();
    expect(input.value).toBe('xyz');
  });
});

// ── A25: a committed value with no matching option still emits and speaks ──
describe('A25: typeahead commits a value with no option', () => {
  it('emits selectionChange and announces when the resolved value has no option', () => {
    const m = mount(KINDS['typeahead'], { commit: () => of('purple') });
    m.pickAt(1);
    m.settle();
    expect(m.events.some((e) => e.name === 'selectionChange')).toBe(true);
    expect(m.spoken.length).toBeGreaterThan(0);
  });
});

// ── B22: the wrapper click honours CNGX_NESTED_INTERACTIVE_SELECTOR ─────────
describe('B22: wrapper click respects the nested-interactive selector', () => {
  for (const key of ['combobox', 'actionMulti'] as const) {
    it.fails(`${key}: a click on a custom nested-interactive descendant does not open the panel`, () => {
      const m = mount(KINDS[key], {
        providers: [{ provide: CNGX_NESTED_INTERACTIVE_SELECTOR, useValue: 'button, .cngx-chip__remove, [data-custom]' }],
      });
      const trigger = m.el.querySelector<HTMLElement>('[class$="__trigger"]')!;
      const custom = document.createElement('span');
      custom.setAttribute('data-custom', '');
      trigger.appendChild(custom);
      custom.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      m.settle();
      expect(m.v.panelOpen()).toBe(false);
    });
  }
});
