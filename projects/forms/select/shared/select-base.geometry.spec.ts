import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Directive,
  model,
  signal,
  ViewEncapsulation,
  type Type,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxFormField, CngxPrefix, type CngxFieldAccessor } from '@cngx/forms/field';
import { CngxInput } from '@cngx/forms/input';
import { createMockField } from '@cngx/forms/field/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';

import { CngxFieldBox } from '../../field/field-box.directive';
import { CngxActionMultiSelect } from '../action-multi-select/action-multi-select.component';
import { CngxActionSelect } from '../action-select/action-select.component';
import { CngxCombobox } from '../combobox/combobox.component';
import { CngxSelectDivider } from '../declarative/divider.component';
import { CngxSelectOptgroup } from '../declarative/optgroup.component';
import { CngxSelectOption } from '../declarative/option.component';
import { CngxSelectSearch } from '../declarative/select-search.component';
import { CNGX_SELECT_SHELL_SEARCH_HOST } from '../declarative/select-search-host';
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
// Focus-state rules are not asserted here. `select-base.css.spec.ts` guards
// them as source text across all nine stylesheets, and
// `select-touch-floor.geometry.spec.ts` reads the painted trigger rings: a
// programmatic `focus()` matches `:focus-visible` in this runner, and those
// assertions fail rather than pass if it ever stops matching.

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

// A readonly fill select keeps its resting surface on hover, like a readonly
// fill input; the editable twin proves the hover rule is live.
@Component({
  selector: 'cngx-select-skin-readonly-host',
  standalone: true,
  imports: [CngxSelect, CngxFormField],
  template: `
    <div style="display: grid; line-height: 1.5">
      <cngx-select class="editable" skin="fill" [label]="'Colour'" [options]="options" />
      <cngx-form-field [field]="readonlyField">
        <cngx-select class="readonly" skin="fill" [label]="'Colour'" [options]="options" />
      </cngx-form-field>
    </div>
  `,
  styleUrls: ['../../theming/components/cngx-field-skin.css'],
})
class ReadonlyHost {
  readonly options = OPTIONS;
  readonly readonlyField: CngxFieldAccessor = createMockField({
    name: 'colour',
    readonly: true,
  }).accessor;
}

// A select used as an interactive affix (a currency picker). The affix block
// stretches to the box row and takes the touch floor; the trigger must fill
// it rather than shrink back to its value line. The full Track-B harness
// loads so the box formula and the affix stretch are the shipped ones; the
// touch floor is set on the fixture because headless runs a fine pointer.
@Component({
  selector: 'cngx-select-affix-block-host',
  standalone: true,
  imports: [CngxFieldBox, CngxPrefix, CngxInput, CngxSelect, CngxTreeSelect],
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    '../../../core/theming/reset.css',
    '../../../core/theming/base.css',
    '../../../core/theming/density-tokens.css',
    '../../theming/components/cngx-field-affix.css',
    '../../theming/components/cngx-field-skin.css',
    './select-base.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div style="--cngx-target-min: 44px">
      <span cngxFieldBox class="affix-row" skin="fill">
        <cngx-select
          class="affix-select"
          cngxPrefix
          cngxPrefixInteractive
          [label]="'Currency'"
          [options]="options"
        />
        <input cngxInput />
      </span>
      <span cngxFieldBox class="affix-tree-row" skin="fill">
        <cngx-tree-select
          class="affix-tree"
          cngxPrefix
          cngxPrefixInteractive
          [label]="'Team'"
          [nodeIdFn]="nodeId"
        />
        <input cngxInput />
      </span>
    </div>
  `,
})
class AffixBlockHost {
  readonly options = OPTIONS;
  readonly nodeId = (value: unknown): string => String(value);
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

// Every variant invalid in the default (outline) skin. Each sits in a touched,
// invalid form field so `aria-invalid` comes from the real presenter path.
@Component({
  selector: 'cngx-select-invalid-triggers-host',
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
  template: `
    <div style="display: grid; line-height: 1.5">
      <cngx-select class="valid-select" [label]="'Colour'" [options]="options" />
      <cngx-form-field [field]="fields[0]">
        <cngx-select class="v-select" [label]="'Colour'" [options]="options" />
      </cngx-form-field>
      <cngx-form-field [field]="fields[1]">
        <cngx-multi-select class="v-multi" [label]="'Colour'" [options]="options" />
      </cngx-form-field>
      <cngx-form-field [field]="fields[2]">
        <cngx-combobox class="v-combobox" [label]="'Colour'" [options]="options" />
      </cngx-form-field>
      <cngx-form-field [field]="fields[3]">
        <cngx-typeahead class="v-typeahead" [label]="'Colour'" [options]="options" />
      </cngx-form-field>
      <cngx-form-field [field]="fields[4]">
        <cngx-tree-select class="v-tree" [label]="'Colour'" [nodeIdFn]="nodeId" />
      </cngx-form-field>
      <cngx-form-field [field]="fields[5]">
        <cngx-action-select class="v-action" [label]="'Colour'" [options]="options" />
      </cngx-form-field>
      <cngx-form-field [field]="fields[6]">
        <cngx-action-multi-select class="v-action-multi" [label]="'Colour'" [options]="options" />
      </cngx-form-field>
      <cngx-form-field [field]="fields[7]">
        <cngx-reorderable-multi-select class="v-reorder" [label]="'Colour'" [options]="options" />
      </cngx-form-field>
      <cngx-form-field [field]="fields[8]">
        <cngx-select-shell class="v-shell" [label]="'Colour'">
          <cngx-option [value]="'red'">Red</cngx-option>
        </cngx-select-shell>
      </cngx-form-field>
    </div>
  `,
  styleUrls: ['../../theming/components/cngx-field-skin.css'],
})
class InvalidTriggersHost {
  readonly options = OPTIONS;
  readonly nodeId = (value: unknown): string => String(value);
  readonly fields: CngxFieldAccessor[] = Array.from(
    { length: 9 },
    (_, i) => createMockField({ name: `colour${i}`, invalid: true, touched: true }).accessor,
  );
}

// A filled, clearable single and multi trigger: the clear button only renders
// with a value, and both variants share the clear-target glyph rule.
@Component({
  selector: 'cngx-select-clearable-triggers-host',
  standalone: true,
  imports: [CngxSelect, CngxMultiSelect],
  template: `
    <div style="display: grid; line-height: 1.5">
      <cngx-select class="v-select" [label]="'Colour'" [options]="options" [value]="'red'" [clearable]="true" />
      <cngx-multi-select class="v-multi" [label]="'Colour'" [options]="options" [values]="['red']" [clearable]="true" />
    </div>
  `,
  styleUrls: ['../../theming/components/cngx-field-skin.css'],
})
class ClearableTriggersHost {
  readonly options = OPTIONS;
}

// A consumer override of the caret colour in a later layer, set on the root
// and on a scheme island. The select scheme swaps live in the tokens layer, so
// the override wins in the light and the dark scheme alike.
@Component({
  selector: 'cngx-select-caret-override-host',
  standalone: true,
  imports: [CngxSelect],
  styleUrls: ['../../../core/theming/layers.css'],
  styles: [
    `
      @layer app {
        :root.cngx-caret-override-probe {
          --cngx-select-caret-color: rgb(1, 2, 3);
        }
        .caret-island {
          --cngx-select-caret-color: rgb(4, 5, 6);
        }
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-select class="v-root" [label]="'Colour'" [options]="options" />
    <div class="caret-island" data-color-scheme="dark">
      <cngx-select class="v-dark-island" [label]="'Colour'" [options]="options" />
    </div>
    <div class="caret-island" data-color-scheme="light">
      <cngx-select class="v-light-island" [label]="'Colour'" [options]="options" />
    </div>
  `,
})
class CaretOverrideHost {
  readonly options = OPTIONS;
}

// An outline and a fill trigger, a panel surface and a dragged chip under
// the full token stack, for the WCAG contrast reads below. The scheme is
// emulated at the root so every :root delegation resolves in it.
@Component({
  selector: 'cngx-select-contrast-host',
  standalone: true,
  imports: [CngxSelect],
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    '../../theming/components/cngx-field-skin.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="contrast-page" style="background: var(--cngx-color-surface); padding: 1rem">
      <cngx-select class="v-outline" [label]="'Colour'" [options]="options" />
      <cngx-select class="v-fill" skin="fill" [label]="'Colour'" [options]="options" />
      <div class="cngx-select__panel contrast-panel" style="position: static">Panel</div>
      <span class="cngx-select__chip cngx-select__chip--dragging contrast-chip">Red</span>
      <span class="muted-probe" style="color: var(--cngx-color-text-muted)">Muted</span>
    </div>
  `,
})
class ContrastHost {
  readonly options = OPTIONS;
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

// The icon svg box rounds to whole pixels: the ink a rule names in em lands
// on the rounded box, `extent` grid units of 24.
function inkOnRoundedBox(inkPx: number, extent: number): number {
  return (Math.round((inkPx * 24) / extent) * extent) / 24;
}

// Line box + 2 * block padding + 2px border, floored by the min-height. Every
// trigger sets border-box itself (this harness loads no global reset), so the
// min-height floors the border box directly.
function boxHeight(el: HTMLElement): number {
  const formula = px(el, 'line-height') + px(el, 'padding-top') + px(el, 'padding-bottom') + 2;
  return Math.max(formula, px(el, 'min-height'));
}

// Paints `layers` in order onto a 1px sRGB canvas and returns the WCAG
// relative luminance of the result, so translucent layers composite the way
// the page draws them.
function luminance(...layers: string[]): number {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext('2d')!;
  for (const layer of layers) {
    context.fillStyle = layer;
    context.fillRect(0, 0, 1, 1);
  }
  const [r, g, b] = Array.from(context.getImageData(0, 0, 1, 1).data.slice(0, 3)).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: number, b: number): number {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.classList.remove('cngx-caret-override-probe');
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('select-family field skins', () => {
  // Self-contained sizing: the min-height floor and width: 100% must not
  // depend on a consumer's global border-box reset, which this harness omits.
  it.each(ALL_TRIGGERS)('sizes the %s trigger as a border box', (hostSelector) => {
    const el = trigger(mount(AllTriggersHost), hostSelector);
    expect(computedValue(el, 'box-sizing')).toBe('border-box');
    expect(el.getBoundingClientRect().height).toBeCloseTo(boxHeight(el), 0);
  });

  // The caret glyph is an SVG whose ink sits centred in its box, and
  // align-items centres that box, so it sits on the trigger's middle whatever
  // the font. The text
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

  // The shared icon grid pads the triangle inside its 24-unit box; the caret
  // rule scales the box so the drawn triangle keeps the 0.27em width the
  // 10-unit caret it replaced drew at the caret font-size.
  // The clear glyph sits in an inline span; as an inline svg it would align
  // to the text middle and land below the caret.
  it.each(['.v-select', '.v-multi'])('centres the default %s clear glyph on the caret', (hostSelector) => {
    const el = trigger(mount(ClearableTriggersHost), hostSelector);
    const clear = el.querySelector('.cngx-select__clear-target svg.cngx-icon-svg path');
    const caret = el.querySelector('[class*="__caret"] svg.cngx-icon-svg path');
    if (!clear || !caret) {
      throw new Error(`${hostSelector} renders no default clear or caret icon`);
    }
    const middle = (node: Element): number => {
      const rect = node.getBoundingClientRect();
      return rect.top + rect.height / 2;
    };
    expect(Math.abs(middle(clear) - middle(caret))).toBeLessThan(0.5);
  });

  it.each(ALL_TRIGGERS)('draws the default %s caret 0.27em wide, on the rounded box', (hostSelector) => {
    const el = trigger(mount(AllTriggersHost), hostSelector);
    const span = el.querySelector<HTMLElement>('[class*="__caret"]');
    const path = span?.querySelector('svg.cngx-icon-svg path');
    if (!span || !path) {
      throw new Error(`${hostSelector} renders no default caret icon`);
    }
    expect(path.getBoundingClientRect().width).toBeCloseTo(
      inkOnRoundedBox(0.27 * px(span, 'font-size'), 14),
      1,
    );
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

  // The invalid carrier is the trigger itself or its inner `[role='combobox']`
  // input; either way the bordered trigger paints the danger border. The
  // single select is the reference for the resolved token colour.
  it.each(ALL_TRIGGERS)('paints the default-skin %s trigger invalid border', (hostSelector) => {
    const root = mount(InvalidTriggersHost);
    const el = trigger(root, hostSelector);
    const carrier = el.matches('[aria-invalid]') ? el : el.querySelector('[role="combobox"]');
    expect(carrier?.getAttribute('aria-invalid')).toBe('true');
    const expected = computedValue(trigger(root, '.v-select'), 'border-top-color');
    expect(expected).not.toBe(computedValue(trigger(root, '.valid-select'), 'border-top-color'));
    expect(computedValue(el, 'border-top-color')).toBe(expected);
  });

  // The ring is read through a probe that resolves the same chain the
  // trigger's focus rule uses, so the colour compare needs no focus. Neither token is set by default; the chain falls back to
  // the theme primary, set here on the document root the way a theme would.
  it('resolves the tree-select focus ring opaque and equal to the select ring', () => {
    const docEl = document.documentElement;
    docEl.style.setProperty('--cngx-color-primary', 'oklch(0.5 0.2 260)');
    try {
      const root = mount(AllTriggersHost);
      const ringColour = (hostSelector: string, chain: string): string => {
        const probe = document.createElement('div');
        probe.style.outline = chain;
        trigger(root, hostSelector).appendChild(probe);
        const colour = computedValue(probe, 'outline-color');
        probe.remove();
        return colour;
      };
      const selectRing = 'var(--cngx-select-focus-outline, 2px solid var(--cngx-color-primary))';
      const tree = ringColour('.v-tree', `var(--cngx-tree-select-focus-ring, ${selectRing})`);
      const select = ringColour('.v-select', selectRing);
      expect(select).not.toBe('rgb(0, 0, 0)');
      expect(tree).toBe(select);
    } finally {
      docEl.style.removeProperty('--cngx-color-primary');
    }
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

  it('keeps the resting background when a readonly fill trigger is hovered', async () => {
    const root = mount(ReadonlyHost);
    const editable = trigger(root, '.editable');
    const readonly = trigger(root, '.readonly');
    expect(root.querySelector('.readonly')?.getAttribute('aria-readonly')).toBe('true');
    const editableRest = computedValue(editable, 'background-color');
    const readonlyRest = computedValue(readonly, 'background-color');
    const readonlyUnderline = computedValue(readonly, 'border-bottom-color');

    await userEvent.hover(editable);
    expect(computedValue(editable, 'background-color')).not.toBe(editableRest);

    await userEvent.hover(readonly);
    expect(computedValue(readonly, 'background-color')).toBe(readonlyRest);
    expect(computedValue(readonly, 'border-bottom-color')).toBe(readonlyUnderline);
  });

  // The single select stands in for the `display: contents` roots, the tree
  // for the block roots.
  it.each([
    ['.affix-row', '.affix-select'],
    ['.affix-tree-row', '.affix-tree'],
  ])('fills the stretched affix block with the trigger of a %s select affix', (rowSel, hostSel) => {
    const root = mount(AffixBlockHost);
    const host = root.querySelector<HTMLElement>(hostSel)!;
    const row = root.querySelector<HTMLElement>(rowSel)!;
    expect(host.classList).toContain('cngx-field-affix--interactive');
    const hostHeight = host.getBoundingClientRect().height;
    const rowContent = row.clientHeight - px(row, 'padding-top') - px(row, 'padding-bottom');
    expect(hostHeight).toBeCloseTo(rowContent, 0);
    expect(trigger(root, hostSel).getBoundingClientRect().height).toBeCloseTo(hostHeight, 0);
  });

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

  describe.each(['light', 'dark'] as const)('%s scheme', (scheme) => {
    async function mountOverride(): Promise<HTMLElement> {
      await cdp().send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-color-scheme', value: scheme }],
      });
      document.documentElement.classList.add('cngx-caret-override-probe');
      const root = mount(CaretOverrideHost);
      expect(matchMedia(`(prefers-color-scheme: ${scheme})`).matches).toBe(true);
      return root;
    }

    function caret(root: HTMLElement, hostSelector: string): HTMLElement {
      const el = trigger(root, hostSelector).querySelector<HTMLElement>('.cngx-select__caret');
      if (!el) {
        throw new Error(`${hostSelector} caret did not render`);
      }
      return el;
    }

    it('lets a layered root override of the caret colour win', async () => {
      const root = await mountOverride();
      expect(computedValue(caret(root, '.v-root'), 'color')).toBe('rgb(1, 2, 3)');
    });

    it.each(['.v-dark-island', '.v-light-island'])(
      'lets a layered override on a scheme island win for %s',
      async (hostSelector) => {
        const root = await mountOverride();
        expect(computedValue(caret(root, hostSelector), 'color')).toBe('rgb(4, 5, 6)');
      },
    );
  });

  describe.each(['light', 'dark'] as const)('%s scheme contrast', (scheme) => {
    async function mountContrast(): Promise<HTMLElement> {
      await cdp().send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-color-scheme', value: scheme }],
      });
      const root = mount(ContrastHost);
      expect(matchMedia(`(prefers-color-scheme: ${scheme})`).matches).toBe(true);
      return root;
    }

    function one(root: HTMLElement, selector: string): HTMLElement {
      const el = root.querySelector<HTMLElement>(selector);
      if (!el) {
        throw new Error(`${selector} did not render`);
      }
      return el;
    }

    it('keeps the outline trigger border at 3:1 on the page, the fill tint and the panel', async () => {
      const root = await mountContrast();
      const surface = computedValue(one(root, '.contrast-page'), 'background-color');
      const border = luminance(
        surface,
        computedValue(trigger(root, '.v-outline'), 'border-top-color'),
      );
      const fill = luminance(surface, computedValue(trigger(root, '.v-fill'), 'background-color'));
      const panel = luminance(
        surface,
        computedValue(one(root, '.contrast-panel'), 'background-color'),
      );
      expect(contrast(border, luminance(surface))).toBeGreaterThanOrEqual(3.5);
      expect(contrast(border, fill)).toBeGreaterThanOrEqual(3);
      expect(contrast(border, panel)).toBeGreaterThanOrEqual(3);
    });

    it('keeps the dragged chip label at 4.5:1 on its background', async () => {
      const root = await mountContrast();
      const chip = one(root, '.contrast-chip');
      const background = luminance(computedValue(chip, 'background-color'));
      expect(contrast(luminance(computedValue(chip, 'color')), background)).toBeGreaterThanOrEqual(
        4.5,
      );
    });

    it('paints the placeholder in the muted text colour', async () => {
      const root = await mountContrast();
      const placeholder = one(root, '.v-outline .cngx-select__label--placeholder');
      expect(computedValue(placeholder, 'color')).toBe(
        computedValue(one(root, '.muted-probe'), 'color'),
      );
    });
  });
});

// Every compactness token of the panel parts and the declarative building
// blocks is SET from the --cngx-space-* scale at its default host, so a
// [data-density] ancestor compacts it. Each density block carries a probe
// that resolves the scale steps in that density.
@Directive({
  selector: '[fakeSearchHost]',
  standalone: true,
  providers: [{ provide: CNGX_SELECT_SHELL_SEARCH_HOST, useExisting: FakeSearchHost }],
})
class FakeSearchHost {
  readonly searchTerm = model<string>('');
  readonly listboxRef = signal(undefined);
  close(): void {
    /* no-op */
  }
  focus(): void {
    /* no-op */
  }
}

const DENSITIES = ['compact', 'comfortable'] as const;

@Component({
  selector: 'cngx-select-density-host',
  standalone: true,
  imports: [
    CngxSelect,
    CngxSelectOption,
    CngxSelectOptgroup,
    CngxSelectDivider,
    CngxSelectSearch,
    FakeSearchHost,
  ],
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    '../../../core/theming/density-tokens.css',
    '../../theming/components/cngx-field-skin.css',
  ],
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @for (density of densities; track density) {
      <div [class]="'d-' + density" [attr.data-density]="density">
        <span
          class="scale-probe"
          style="
            padding-block-start: var(--cngx-space-xs);
            padding-inline-start: var(--cngx-space-sm);
            padding-inline-end: var(--cngx-space-md);
          "
        ></span>
        <cngx-select class="fill" skin="fill" [label]="'Colour'" [options]="options" />
        <cngx-select
          class="loading-text"
          [label]="'Loading'"
          [options]="[]"
          [loading]="true"
          loadingVariant="text"
        />
        <cngx-select-shell>
          <div class="cngx-select__panel" style="position: static">
            <div class="cngx-select__action--top">Top</div>
            <div class="cngx-select__group-header">Group</div>
            <div class="cngx-select__option">Row</div>
            <div class="cngx-select__empty">Empty</div>
            <div class="cngx-select__action--bottom">Bottom</div>
          </div>
        </cngx-select-shell>
        <cngx-option class="decl-option" [value]="'red'">Red</cngx-option>
        <cngx-optgroup label="Warm">
          <cngx-option [value]="'amber'">Amber</cngx-option>
        </cngx-optgroup>
        <cngx-select-divider class="decl-divider" />
        <div fakeSearchHost><cngx-select-search /></div>
      </div>
    }
  `,
})
class DensityHost {
  readonly densities = DENSITIES;
  readonly options = OPTIONS;
}

// Loads only the foundation and density tokens, never select-base.css, so the
// optgroup header can only take its padding from optgroup.component.css.
@Component({
  selector: 'cngx-select-optgroup-density-host',
  standalone: true,
  imports: [CngxSelectOptgroup, CngxSelectOption],
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    '../../../core/theming/density-tokens.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (density of densities; track density) {
      <div [class]="'d-' + density" [attr.data-density]="density">
        <span
          class="scale-probe"
          style="
            padding-block-start: var(--cngx-space-xs);
            padding-inline-start: var(--cngx-space-sm);
            padding-inline-end: var(--cngx-space-md);
          "
        ></span>
        <cngx-optgroup label="Warm">
          <cngx-option [value]="'amber'">Amber</cngx-option>
        </cngx-optgroup>
      </div>
    }
  `,
})
class OptgroupDensityHost {
  readonly densities = DENSITIES;
}

describe('select-family density derivation', () => {
  type Box = 'padding' | 'margin';
  type Side = 'top' | 'right' | 'bottom' | 'left';
  type Step = 'xs' | 'sm' | 'md' | '0';

  function scale(block: HTMLElement): Record<Step, string> {
    const probe = block.querySelector<HTMLElement>('.scale-probe')!;
    return {
      xs: computedValue(probe, 'padding-top'),
      sm: computedValue(probe, 'padding-left'),
      md: computedValue(probe, 'padding-right'),
      '0': '0px',
    };
  }

  function el(block: HTMLElement, selector: string): HTMLElement {
    const found = block.querySelector<HTMLElement>(selector);
    if (!found) {
      throw new Error(`${selector} did not render`);
    }
    return found;
  }

  // [selector, box, block step, inline step]
  const CASES: [string, Box, Step, Step][] = [
    ['.cngx-select__group-header', 'padding', 'xs', 'sm'],
    ['cngx-optgroup .cngx-select__group-header', 'padding', 'xs', 'sm'],
    ['.cngx-select__option', 'padding', 'xs', 'sm'],
    ['cngx-option.decl-option', 'padding', 'xs', 'sm'],
    ['.cngx-select__empty', 'padding', 'sm', 'sm'],
    ['.loading-text .cngx-select__loading', 'padding', 'sm', 'sm'],
    ['cngx-select-divider.decl-divider', 'margin', 'xs', '0'],
    ['cngx-select-search', 'padding', 'sm', 'sm'],
    ['.cngx-select-search__input', 'padding', 'xs', 'sm'],
    ['.fill .cngx-field-trigger', 'padding', 'sm', 'md'],
  ];

  it.each(CASES)('sets the %s %s from the scale in every density', (selector, box, blockStep, inlineStep) => {
    const root = mount(DensityHost);
    const seen = new Set<string>();
    for (const density of DENSITIES) {
      const block = el(root, `.d-${density}`);
      const steps = scale(block);
      const target = el(block, selector);
      const sides: [Side, Step][] = [
        ['top', blockStep],
        ['bottom', blockStep],
        ['left', inlineStep],
      ];
      for (const [side, step] of sides) {
        expect(computedValue(target, `${box}-${side}`), `${density} ${side}`).toBe(steps[step]);
      }
      seen.add(computedValue(target, `${box}-top`));
    }
    expect(seen.size).toBe(DENSITIES.length);
  });

  it('sets the declarative optgroup header padding from its own stylesheet', () => {
    const root = mount(OptgroupDensityHost);
    expect(
      Array.from(document.styleSheets).some((sheet) =>
        Array.from(sheet.cssRules).some((rule) => rule.cssText.includes('.cngx-select__panel')),
      ),
      'select-base.css must not be loaded',
    ).toBe(false);
    const seen = new Set<string>();
    for (const density of DENSITIES) {
      const block = el(root, `.d-${density}`);
      const { xs, sm } = scale(block);
      const header = el(block, 'cngx-optgroup .cngx-select__group-header');
      expect(computedValue(header, 'padding-top'), `${density} top`).toBe(xs);
      expect(computedValue(header, 'padding-bottom'), `${density} bottom`).toBe(xs);
      expect(computedValue(header, 'padding-left'), `${density} left`).toBe(sm);
      seen.add(computedValue(header, 'padding-top'));
    }
    expect(seen.size).toBe(DENSITIES.length);
  });

  it('sets the option-row gap from the scale on the data-mode and declarative rows', () => {
    const root = mount(DensityHost);
    for (const density of DENSITIES) {
      const block = el(root, `.d-${density}`);
      const { sm } = scale(block);
      expect(computedValue(el(block, '.cngx-select__option'), 'column-gap')).toBe(sm);
      expect(computedValue(el(block, 'cngx-option.decl-option'), 'column-gap')).toBe(sm);
    }
  });

  it('sets the action separator padding and margin from the scale', () => {
    const root = mount(DensityHost);
    for (const density of DENSITIES) {
      const block = el(root, `.d-${density}`);
      const { xs } = scale(block);
      const top = el(block, '.cngx-select__action--top');
      const bottom = el(block, '.cngx-select__action--bottom');
      expect(computedValue(top, 'padding-bottom')).toBe(xs);
      expect(computedValue(top, 'margin-bottom')).toBe(xs);
      expect(computedValue(bottom, 'padding-top')).toBe(xs);
      expect(computedValue(bottom, 'margin-top')).toBe(xs);
    }
  });
});
