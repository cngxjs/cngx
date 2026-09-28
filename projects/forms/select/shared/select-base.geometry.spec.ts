import { Component, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxFormField, type CngxFieldAccessor } from '@cngx/forms/field';
import { createMockField } from '@cngx/forms/field/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxMultiSelect } from '../multi-select/multi-select.component';
import { CngxSelect } from '../single-select/select.component';
import { CngxTypeahead } from '../typeahead/typeahead.component';
import type { CngxSelectOptionDef } from './option.model';

// Runs in a real Chromium (the `test-geometry` target). Covers the resting
// half of the field-skin blocks every variant stylesheet carries: the trigger
// - not the component host - is the box, and a trigger nested inside a field
// box is reset to transparent so the box alone draws the surface.
// Two variants stand in for the two trigger shapes (single row and chip
// strip); the remaining seven reuse the same CSS paths.
//
// Focus-state rules are NOT asserted here. The headless page has no document
// focus, so `:focus-visible` / `:focus-within` never match even when
// `document.activeElement` is the trigger - an assertion on them would either
// fail or pass vacuously. `select-base.css.spec.ts` guards those rules as
// source text across all nine stylesheets instead.

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
];

@Component({
  selector: 'cngx-select-skin-geometry-host',
  standalone: true,
  imports: [CngxSelect, CngxMultiSelect],
  template: `
    <div style="display: grid; line-height: 1.5">
      <cngx-select class="solo" skin="fill" [label]="'Colour'" [options]="options" />
      <cngx-multi-select class="chips" skin="fill" [label]="'Colours'" [options]="options" />
      <span class="cngx-field-box cngx-field-affix-row row" data-skin="fill">
        <cngx-select class="nested" skin="bare" [label]="'Currency'" [options]="options" />
      </span>
    </div>
  `,
  styleUrls: ['../../theming/components/cngx-field-skin.css'],
})
class SkinHost {
  readonly options = OPTIONS;
  readonly value = signal<string | undefined>(undefined);
}

// The wrapper triggers (combobox, typeahead, both action variants) carry
// `aria-invalid` / `disabled` on the inner `[role='combobox']` input, not on
// the trigger. The typeahead stands in for all four.
@Component({
  selector: 'cngx-select-skin-state-host',
  standalone: true,
  imports: [CngxTypeahead, CngxFormField],
  template: `
    <div style="display: grid; line-height: 1.5">
      <cngx-typeahead class="valid" skin="fill" [label]="'Colour'" [options]="options" />
      <cngx-form-field [field]="invalidField">
        <cngx-typeahead class="invalid" skin="fill" [label]="'Colour'" [options]="options" />
      </cngx-form-field>
      <cngx-typeahead
        class="off"
        skin="fill"
        [disabled]="true"
        [label]="'Colour'"
        [options]="options"
      />
      <cngx-typeahead class="bare-valid" skin="bare" [label]="'Colour'" [options]="options" />
      <cngx-form-field [field]="invalidBareField">
        <cngx-typeahead class="bare-invalid" skin="bare" [label]="'Colour'" [options]="options" />
      </cngx-form-field>
    </div>
  `,
  styleUrls: ['../../theming/components/cngx-field-skin.css'],
})
class StateHost {
  readonly options = OPTIONS;
  readonly invalidField: CngxFieldAccessor = createMockField({
    name: 'colour',
    invalid: true,
    touched: true,
  }).accessor;
  readonly invalidBareField: CngxFieldAccessor = createMockField({
    name: 'shade',
    invalid: true,
    touched: true,
  }).accessor;
}

let mountedRoot: HTMLElement | null = null;

function mount(host: Type<unknown> = SkinHost): HTMLElement {
  const fixture = TestBed.createComponent(host);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function trigger(root: HTMLElement, hostSelector: string): HTMLElement {
  const el = root.querySelector(`${hostSelector} .cngx-field-trigger`);
  if (!el) {
    throw new Error(`${hostSelector} trigger did not render`);
  }
  return el as HTMLElement;
}

function px(el: Element, property: string): number {
  const value = parseFloat(computedValue(el, property));
  if (Number.isNaN(value)) {
    throw new Error(`${property} is not a length: '${computedValue(el, property)}'`);
  }
  return value;
}

// A min-height floors the border box only under border-box sizing. This harness
// loads no global reset, and some variant triggers do not set box-sizing
// themselves, so the floor is converted to the border box it produces.
function boxHeight(el: HTMLElement): number {
  const chrome = px(el, 'padding-top') + px(el, 'padding-bottom') + 2;
  const formula = px(el, 'line-height') + chrome;
  const contentBox = computedValue(el, 'box-sizing') === 'content-box';
  const floor = px(el, 'min-height') + (contentBox ? chrome : 0);
  return Math.max(formula, floor);
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('select-family field skins', () => {
  it('draws the fill trigger as an underline, not a box', () => {
    const el = trigger(mount(), '.solo');
    expect(computedValue(el, 'border-bottom-width')).toBe('1px');
    expect(computedValue(el, 'border-top-width')).toBe('1px');
    expect(computedValue(el, 'border-top-color')).toBe('rgba(0, 0, 0, 0)');
  });

  it('applies the same treatment to a chip-strip trigger', () => {
    const el = trigger(mount(), '.chips');
    expect(computedValue(el, 'border-bottom-width')).toBe('1px');
    expect(computedValue(el, 'border-top-width')).toBe('1px');
    expect(computedValue(el, 'border-top-color')).toBe('rgba(0, 0, 0, 0)');
  });

  it('resets a trigger nested in a field box so the box draws the only chrome', () => {
    const root = mount();
    const nested = trigger(root, '.nested');
    const row = root.querySelector('.row') as HTMLElement;
    // The nested select resolves to bare; the bare root excludes a box child
    // and the nested reset strips the base trigger chrome, 2.125rem floor
    // included.
    expect(computedValue(nested, 'border-top-width')).toBe('0px');
    expect(computedValue(nested, 'padding-top')).toBe('0px');
    expect(computedValue(nested, 'min-height')).toBe('0px');
    expect(computedValue(row, 'border-bottom-width')).toBe('1px');
    expect(computedValue(row, 'border-top-color')).toBe('rgba(0, 0, 0, 0)');
  });

  it('turns the underline to the error colour when the inner combobox input is invalid', () => {
    const root = mount(StateHost);
    const valid = computedValue(trigger(root, '.valid'), 'border-bottom-color');
    const invalid = computedValue(trigger(root, '.invalid'), 'border-bottom-color');
    expect(invalid).not.toBe(valid);
  });

  it('shows a bare error as tinted trigger text, never as a line', () => {
    const root = mount(StateHost);
    const valid = trigger(root, '.bare-valid');
    const invalid = trigger(root, '.bare-invalid');
    expect(computedValue(invalid, 'border-bottom-color')).toBe('rgba(0, 0, 0, 0)');
    expect(computedValue(invalid, 'box-shadow')).toBe('none');
    expect(computedValue(invalid, 'color')).not.toBe(computedValue(valid, 'color'));
    expect(computedValue(invalid, 'outline-style')).toBe('solid');
    expect(computedValue(valid, 'outline-style')).toBe('none');
  });

  // The trigger is a box like any other: line box + 2 * block padding + 2px
  // border, floored by its own min-height (the 2.125rem trigger floor).
  it.each(['.solo', '.chips'])(
    'sizes the fill %s trigger by the shared box formula',
    (hostSelector) => {
      const el = trigger(mount(), hostSelector);
      expect(el.getBoundingClientRect().height).toBeCloseTo(boxHeight(el), 0);
    },
  );

  it.each(['.bare-valid', '.bare-invalid'])(
    'sizes the bare %s trigger by the shared box formula',
    (hostSelector) => {
      const el = trigger(mount(StateHost), hostSelector);
      expect(el.getBoundingClientRect().height).toBeCloseTo(boxHeight(el), 0);
    },
  );

  it('dashes the underline when the inner combobox input is disabled', () => {
    const el = trigger(mount(StateHost), '.off');
    expect(computedValue(el, 'border-bottom-style')).toBe('dashed');
  });
});
