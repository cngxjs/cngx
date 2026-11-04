import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxFormField } from '@cngx/forms/field';
import type { CngxFieldAccessor } from '@cngx/forms/field';
import { createMockField } from '@cngx/forms/field/testing';

import { CngxActionSelect } from '../action-select/action-select.component';
import { CngxSelectOption } from '../declarative/option.component';
import { CngxSelectShell } from '../select-shell/select-shell.component';
import { CngxSelect } from '../single-select/select.component';
import { CngxTypeahead } from '../typeahead/typeahead.component';

const mountedRoots: HTMLElement[] = [];
afterEach(() => {
  mountedRoots.splice(0).forEach((el) => el.remove());
});

function flush(fixture: ComponentFixture<unknown>): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

interface ScalarVariant {
  readonly name: string;
  readonly component: Type<unknown>;
  readonly selector: string;
  /** Projected `<cngx-option>` body instead of the `[options]` input. */
  readonly projected: boolean;
  /** Whether the composite already coerces an empty field value to undefined. */
  readonly coerces: boolean;
}

const VARIANTS: readonly ScalarVariant[] = [
  { name: 'CngxSelect', component: CngxSelect, selector: 'cngx-select', projected: false, coerces: true },
  { name: 'CngxTypeahead', component: CngxTypeahead, selector: 'cngx-typeahead', projected: false, coerces: true },
  { name: 'CngxActionSelect', component: CngxActionSelect, selector: 'cngx-action-select', projected: false, coerces: true },
  { name: 'CngxSelectShell', component: CngxSelectShell, selector: 'cngx-select-shell', projected: true, coerces: true },
];

// A26 / A5: a scalar composite bound to a form field whose value is '' or null
// reads as the empty value, so the component value is coerced to undefined - the
// same contract typeahead and action-select already honour. Phase 3 shares one
// coercion helper and flips single-select and shell.
describe('scalar field coercion', () => {
  for (const variant of VARIANTS) {
    for (const empty of ['empty string', 'null'] as const) {
      const run = variant.coerces ? it : it.fails;
      run(`${variant.name}: a field ${empty} reads as undefined`, () => {
        @Component({ template: '', imports: [] })
        class Host {
          readonly options = signal([{ value: 'red', label: 'Red' }]);
          readonly field: CngxFieldAccessor<string | null> = createMockField<string | null>({
            name: 'colour',
            value: empty === 'null' ? null : '',
          }).accessor;
        }
        const body = variant.projected
          ? `<cngx-option [value]="'red'">Red</cngx-option>`
          : '';
        const optionInput = variant.projected ? '' : '[options]="options()"';
        TestBed.overrideComponent(Host, {
          set: {
            template: `
              <cngx-form-field [field]="field">
                <${variant.selector} [label]="'Colour'" ${optionInput}>${body}</${variant.selector}>
              </cngx-form-field>
            `,
            imports: [CngxFormField, variant.component, CngxSelectOption],
          },
        });
        const fixture = TestBed.createComponent(Host);
        const root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        mountedRoots.push(root);
        fixture.detectChanges();
        flush(fixture);
        const cmp = fixture.debugElement.query(By.directive(variant.component))
          .componentInstance as { value: () => unknown; empty: () => boolean };
        expect(cmp.value()).toBeUndefined();
        expect(cmp.empty()).toBe(true);
      });
    }
  }
});
