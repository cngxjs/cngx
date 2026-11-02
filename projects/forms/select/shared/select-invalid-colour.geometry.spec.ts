/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxFormField, type CngxFieldAccessor } from '@cngx/forms/field';
import { createMockField } from '@cngx/forms/field/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxActionMultiSelect } from '../action-multi-select/action-multi-select.component';
import { CngxActionSelect } from '../action-select/action-select.component';
import { CngxCombobox } from '../combobox/combobox.component';
import { CngxSelectOption } from '../declarative/option.component';
import { CngxMultiSelect } from '../multi-select/multi-select.component';
import { CngxReorderableMultiSelect } from '../reorderable-multi-select/reorderable-multi-select.component';
import { CngxSelectShell } from '../select-shell/select-shell.component';
import { CngxSelect } from '../single-select/select.component';
import { CngxTreeSelect } from '../tree-select/tree-select.component';
import { CngxTypeahead } from '../typeahead/typeahead.component';
import type { CngxSelectOptionDef } from './option.model';

// Runs in a real Chromium (the `test-geometry` target). The invalid trigger
// border and focus outline read two registered colour tokens that select-base
// delegates to `--cngx-color-danger` on :root. They must reach the trigger, so
// the painted colour follows the danger colour in the dark scheme and under a
// re-themed danger, not the fixed light initial-value.

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
];

@Component({
  selector: 'cngx-select-invalid-colour-host',
  standalone: true,
  imports: [
    CngxFormField,
    CngxSelect,
    CngxMultiSelect,
    CngxCombobox,
    CngxTypeahead,
    CngxTreeSelect,
    CngxActionSelect,
    CngxActionMultiSelect,
    CngxReorderableMultiSelect,
    CngxSelectShell,
    CngxSelectOption,
  ],
  styleUrls: ['../../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div style="display: grid; gap: 1rem; inline-size: 20rem">
      <cngx-form-field [field]="field">
        <cngx-select class="v-select" [label]="'C'" [options]="options" />
      </cngx-form-field>
      <cngx-form-field [field]="field">
        <cngx-multi-select class="v-multi" [label]="'C'" [options]="options" />
      </cngx-form-field>
      <cngx-form-field [field]="field">
        <cngx-combobox class="v-combobox" [label]="'C'" [options]="options" />
      </cngx-form-field>
      <cngx-form-field [field]="field">
        <cngx-typeahead class="v-typeahead" [label]="'C'" [options]="options" />
      </cngx-form-field>
      <cngx-form-field [field]="field">
        <cngx-tree-select class="v-tree" [label]="'C'" [nodes]="options" [nodeIdFn]="nodeId" />
      </cngx-form-field>
      <cngx-form-field [field]="field">
        <cngx-action-select class="v-action" [label]="'C'" [options]="options" />
      </cngx-form-field>
      <cngx-form-field [field]="field">
        <cngx-action-multi-select class="v-action-multi" [label]="'C'" [options]="options" />
      </cngx-form-field>
      <cngx-form-field [field]="field">
        <cngx-reorderable-multi-select class="v-reorder" [label]="'C'" [options]="options" />
      </cngx-form-field>
      <cngx-form-field [field]="field">
        <cngx-select-shell class="v-shell" [label]="'C'">
          <cngx-option [value]="'red'">Red</cngx-option>
        </cngx-select-shell>
      </cngx-form-field>
      <span class="probe-danger" style="color: var(--cngx-color-danger)"></span>
      <span class="probe-initial" style="color: oklch(0.6 0.18 25)"></span>
    </div>
  `,
})
class InvalidHost {
  readonly options = OPTIONS;
  readonly nodeId = (value: unknown): string => String(value);
  readonly field: CngxFieldAccessor = createMockField({
    name: 'colour',
    invalid: true,
    touched: true,
  }).accessor;
}

const VARIANTS = [
  '.v-select',
  '.v-multi',
  '.v-combobox',
  '.v-typeahead',
  '.v-tree',
  '.v-action',
  '.v-action-multi',
  '.v-reorder',
  '.v-shell',
];

const RETHEMED_DANGER = 'oklch(0.5 0.2 300)';

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(InvalidHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

function invalidTrigger(root: HTMLElement, variant: string): HTMLElement {
  const trigger = one(root, `${variant} .cngx-field-trigger`);
  const invalid =
    trigger.getAttribute('aria-invalid') ??
    trigger.querySelector(':scope > [role="combobox"]')?.getAttribute('aria-invalid');
  expect(invalid).toBe('true');
  return trigger;
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.style.removeProperty('--cngx-color-danger');
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('select-family invalid trigger colour', () => {
  it.each(VARIANTS)('paints the %s invalid border in the danger colour (light)', (variant) => {
    const root = mount();
    const danger = computedValue(one(root, '.probe-danger'), 'color');
    expect(computedValue(invalidTrigger(root, variant), 'border-top-color')).toBe(danger);
  });

  it.each(VARIANTS)('follows the dark danger colour on the %s invalid border', async (variant) => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: 'dark' }],
    });
    const root = mount();
    expect(matchMedia('(prefers-color-scheme: dark)').matches).toBe(true);
    const danger = computedValue(one(root, '.probe-danger'), 'color');
    expect(danger).not.toBe(computedValue(one(root, '.probe-initial'), 'color'));
    expect(computedValue(invalidTrigger(root, variant), 'border-top-color')).toBe(danger);
  });

  it.each(VARIANTS)('follows a re-themed danger colour on the %s invalid border', (variant) => {
    document.documentElement.style.setProperty('--cngx-color-danger', RETHEMED_DANGER);
    const root = mount();
    const danger = computedValue(one(root, '.probe-danger'), 'color');
    expect(computedValue(invalidTrigger(root, variant), 'border-top-color')).toBe(danger);
  });

  it('follows a re-themed danger colour on the focused invalid outline', () => {
    document.documentElement.style.setProperty('--cngx-color-danger', RETHEMED_DANGER);
    const root = mount();
    const danger = computedValue(one(root, '.probe-danger'), 'color');
    const trigger = invalidTrigger(root, '.v-select');
    trigger.focus();
    expect(trigger.matches(':focus-within')).toBe(true);
    expect(computedValue(trigger, 'outline-color')).toBe(danger);
  });
});
