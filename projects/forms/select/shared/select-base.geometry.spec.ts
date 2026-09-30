import { Component, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxFormField, type CngxFieldAccessor } from '@cngx/forms/field';
import { createMockField } from '@cngx/forms/field/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

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
  imports: [CngxTypeahead, CngxSelect, CngxFormField],
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
      <cngx-typeahead
        class="outline-off"
        [disabled]="true"
        [label]="'Colour'"
        [options]="options"
      />
      <cngx-select class="select-outline-off" [disabled]="true" [label]="'Colour'" [options]="options" />
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

// Every variant in the default (outline) skin, so the box-sizing contract is
// checked on all nine triggers, not only the two shape stand-ins above.
@Component({
  selector: 'cngx-select-trigger-box-host',
  standalone: true,
  imports: [
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
  template: `
    <div style="display: grid; line-height: 1.5">
      <cngx-select class="v-select" [label]="'Colour'" [options]="options" />
      <cngx-multi-select class="v-multi" [label]="'Colour'" [options]="options" />
      <cngx-combobox class="v-combobox" [label]="'Colour'" [options]="options" />
      <cngx-typeahead class="v-typeahead" [label]="'Colour'" [options]="options" />
      <cngx-tree-select class="v-tree" [label]="'Colour'" [nodeIdFn]="nodeId" />
      <cngx-action-select class="v-action" [label]="'Colour'" [options]="options" />
      <cngx-action-multi-select class="v-action-multi" [label]="'Colour'" [options]="options" />
      <cngx-reorderable-multi-select class="v-reorder" [label]="'Colour'" [options]="options" />
      <cngx-select-shell class="v-shell" [label]="'Colour'">
        <cngx-option [value]="'red'">Red</cngx-option>
      </cngx-select-shell>
    </div>
  `,
  styleUrls: ['../../theming/components/cngx-field-skin.css'],
})
class AllTriggersHost {
  readonly options = OPTIONS;
  readonly nodeId = (value: unknown): string => String(value);
}

const ALL_TRIGGERS = [
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

// Line box + 2 * block padding + 2px border, floored by the min-height. Every
// trigger sets border-box itself (this harness loads no global reset), so the
// min-height floors the border box directly.
function boxHeight(el: HTMLElement): number {
  const formula = px(el, 'line-height') + px(el, 'padding-top') + px(el, 'padding-bottom') + 2;
  return Math.max(formula, px(el, 'min-height'));
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('select-family field skins', () => {
  // Self-contained sizing: the min-height floor and width: 100% must not
  // depend on a consumer's global border-box reset, which this harness omits.
  it.each(ALL_TRIGGERS)('sizes the %s trigger as a border box', (hostSelector) => {
    const el = trigger(mount(AllTriggersHost), hostSelector);
    expect(computedValue(el, 'box-sizing')).toBe('border-box');
    expect(el.getBoundingClientRect().height).toBeCloseTo(boxHeight(el), 0);
  });

  // The caret glyph is an SVG whose box is its ink, and align-items centres
  // that box, so it sits on the trigger's middle whatever the font. The text
  // glyph it replaced sat about 0.13 x the caret size low, visible next to the
  // value in a content-sized bare picker nested in a field box.
  it.each([
    ['nested bare picker', SkinHost, '.nested'],
    ['fill select', SkinHost, '.solo'],
    ['fill multi-select', SkinHost, '.chips'],
    ['fill typeahead', StateHost, '.valid'],
  ] as const)('centres the default caret on the %s trigger', (_name, host, hostSelector) => {
    const el = trigger(mount(host), hostSelector);
    const glyph = el.querySelector('[class*="__caret"] svg');
    if (!glyph) {
      throw new Error(`${hostSelector} renders no caret svg`);
    }
    const box = el.getBoundingClientRect();
    const caret = glyph.getBoundingClientRect();
    expect(caret.height).toBeGreaterThan(0);
    expect(Math.abs(caret.top + caret.height / 2 - (box.top + box.height / 2))).toBeLessThanOrEqual(0.5);
  });

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

  // Outline is the default skin and writes no data-skin; disabled fades by
  // colour there too, with the variant opacity lifted.
  it.each(['.outline-off', '.select-outline-off'])(
    'paints a disabled outline trigger (%s) by colour and a dashed border, not opacity',
    (hostSelector) => {
      const root = mount(StateHost);
      const el = trigger(root, hostSelector);
      expect(computedValue(el, 'opacity')).toBe('1');
      for (const side of ['top', 'right', 'bottom', 'left']) {
        expect(computedValue(el, `border-${side}-style`)).toBe('dashed');
      }
      expect(computedValue(el, 'color')).not.toBe(computedValue(trigger(root, '.valid'), 'color'));
    },
  );

  it.each(['.off', '.outline-off'])(
    'keeps the disabled inner combobox input (%s) at full opacity in the trigger colour',
    (hostSelector) => {
      const el = trigger(mount(StateHost), hostSelector);
      const input = el.querySelector<HTMLElement>(':scope > [role="combobox"]');
      expect(input).not.toBeNull();
      expect(computedValue(input!, 'opacity')).toBe('1');
      expect(computedValue(input!, 'color')).toBe(computedValue(el, 'color'));
    },
  );
});
