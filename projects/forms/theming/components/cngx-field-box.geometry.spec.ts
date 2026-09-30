import { Component, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxIcon } from '@cngx/common/display';
import { CngxFormField, CngxLabel, CngxPrefix, CngxSuffix } from '@cngx/forms/field';
import { createMockField } from '@cngx/forms/field/testing';
import { CngxInput } from '@cngx/forms/input';
import { CngxMultiSelect, CngxSelect, type CngxSelectOptionDef } from '@cngx/forms/select';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxFieldBox } from '../../field/field-box.directive';

// Runs in a real Chromium (the `test-geometry` target). This is Track-B CSS: it
// ships in the aggregated `cngx.css`, not on any component styleUrl, so the
// hosts below load the exact files via `styleUrls` under
// `ViewEncapsulation.None`. jsdom reports `''` for these reads.
//
// The box model under test: every skin x control x affix composition is
// `line box + 2 * block padding + 2 * 1px border`, floored by the box's own
// min-height (0 on a fine pointer, 44px under [data-touch='on'], the 2.125rem
// trigger floor on a lone select). Asserted as a formula against the measured
// line box, not as literals, so it holds at any control font; the literal
// 42 / 34 / 50 table rides on the control font and is pinned separately.

@Component({
  selector: 'cngx-field-box-geometry-host',
  standalone: true,
  imports: [CngxFieldBox, CngxIcon],
  styleUrls: ['./cngx-field-affix.css', '../../../common/display/icon/icon.component.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div cngxFieldBox>
      <span class="cngx-field-prefix">$</span>
      <input type="text" />
      <span class="cngx-field-suffix">kg</span>
    </div>
    <div cngxFieldBox class="patterns">
      <span class="cngx-field-prefix"><cngx-icon>search</cngx-icon></span>
      <input type="text" />
      <button type="button" class="cngx-field-suffix cngx-field-affix--interactive">x</button>
    </div>
  `,
})
class AffixHost {}

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'chf', label: 'CHF' },
  { value: 'eur', label: 'EUR' },
];

type Skin = 'outline' | 'fill' | 'bare';
type Density = 'comfortable' | 'compact' | 'spacious';

// The shared harness list is part of the contract: the formula only holds with
// the reset (border-box), the base control rules, the density swap and all
// three skin stylesheets in their real layers.
const HARNESS_STYLES = [
  '../../../core/theming/layers.css',
  '../../../core/theming/system-tokens.css',
  '../../../core/theming/reset.css',
  '../../../core/theming/base.css',
  '../../../core/theming/density-tokens.css',
  './cngx-field-affix.css',
  './cngx-field-skin.css',
  '../../select/shared/select-base.css',
];

@Component({
  selector: 'cngx-field-box-matrix-host',
  standalone: true,
  imports: [CngxFieldBox, CngxInput, CngxPrefix, CngxSuffix, CngxSelect, CngxMultiSelect, CngxIcon],
  styleUrls: HARNESS_STYLES,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div [attr.data-density]="density()" [attr.data-touch]="touch()">
      <p><input cngxInput class="c-input" [skin]="skin()" /></p>
      <p><textarea cngxInput class="c-textarea" rows="1" [skin]="skin()"></textarea></p>
      <p><textarea cngxInput class="c-textarea-default" [skin]="skin()"></textarea></p>
      <p>
        <span cngxFieldBox class="c-text-affix" [skin]="skin()">
          <span cngxPrefix>CHF</span>
          <input cngxInput />
        </span>
      </p>
      <p>
        <span cngxFieldBox class="c-icon-button" [skin]="skin()">
          <input cngxInput />
          <button type="button" cngxSuffix cngxSuffixInteractive aria-label="Clear">
            <cngx-icon>close</cngx-icon>
          </button>
        </span>
      </p>
      <p>
        <span cngxFieldBox class="c-text-button" [skin]="skin()">
          <input cngxInput />
          <button type="button" cngxSuffix cngxSuffixInteractive>Apply</button>
        </span>
      </p>
      <p>
        <span cngxFieldBox class="c-nested-select" [skin]="skin()">
          <cngx-select cngxPrefix [label]="'Currency'" [options]="options" />
          <input cngxInput />
        </span>
      </p>
      <p>
        <cngx-select class="c-single" [skin]="skin()" [label]="'Colour'" [options]="options" />
      </p>
      <p>
        <cngx-multi-select
          class="c-chips"
          [skin]="skin()"
          [label]="'Colours'"
          [options]="options"
        />
      </p>
    </div>
  `,
})
class MatrixHost {
  readonly options = OPTIONS;
  readonly skin = signal<Skin>('outline');
  readonly density = signal<Density>('comfortable');
  readonly touch = signal<'on' | null>(null);
}

@Component({
  selector: 'cngx-field-box-inert-host',
  standalone: true,
  imports: [CngxFieldBox, CngxInput, CngxSelect, CngxFormField],
  styleUrls: HARNESS_STYLES,
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (skin of skins; track skin) {
      <cngx-form-field [field]="field({ invalid: true, touched: true })">
        <span cngxFieldBox class="invalid-input" [attr.data-case]="skin" [skin]="skin">
          <input cngxInput />
        </span>
      </cngx-form-field>
      <cngx-form-field [field]="field({ disabled: true })">
        <span cngxFieldBox class="disabled-input" [attr.data-case]="skin" [skin]="skin">
          <input cngxInput />
        </span>
      </cngx-form-field>
      <cngx-form-field [field]="field({ invalid: true, touched: true })">
        <span cngxFieldBox class="invalid-select" [attr.data-case]="skin" [skin]="skin">
          <cngx-select [label]="'Currency'" [options]="options" />
        </span>
      </cngx-form-field>
      <span cngxFieldBox class="disabled-select" [attr.data-case]="skin" [skin]="skin">
        <cngx-select [disabled]="true" [label]="'Currency'" [options]="options" />
      </span>
    }
  `,
})
class InertHost {
  readonly options = OPTIONS;
  readonly skins: readonly Skin[] = ['outline', 'fill', 'bare'];
  private readonly fields = new Map<string, ReturnType<typeof createMockField>['accessor']>();

  field(options: { invalid?: boolean; touched?: boolean; disabled?: boolean }) {
    const key = JSON.stringify(options);
    const cached = this.fields.get(key);
    if (cached) {
      return cached;
    }
    const accessor = createMockField({ name: key, ...options }).accessor;
    this.fields.set(key, accessor);
    return accessor;
  }
}

// A label placed inside the box: the Material 3 filled look without a float.
// One field per composition, because a label belongs to exactly one field.
@Component({
  selector: 'cngx-field-box-inner-label-host',
  standalone: true,
  imports: [CngxFieldBox, CngxFormField, CngxLabel, CngxInput, CngxPrefix, CngxSuffix, CngxIcon],
  styleUrls: [...HARNESS_STYLES, './cngx-field-text.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div [attr.data-density]="density()" [attr.data-touch]="touch()">
      <cngx-form-field [field]="plain">
        <span cngxFieldBox class="l-plain" [skin]="skin()">
          <label cngxLabel>Name</label>
          <input cngxInput />
        </span>
      </cngx-form-field>
      <cngx-form-field [field]="affixed">
        <span cngxFieldBox class="l-affixed" [skin]="skin()">
          <label cngxLabel>Amount</label>
          <span cngxPrefix>CHF</span>
          <input cngxInput />
          <button type="button" cngxSuffix cngxSuffixInteractive aria-label="Clear">
            <cngx-icon>close</cngx-icon>
          </button>
          <span cngxSuffix>/ month</span>
        </span>
      </cngx-form-field>
    </div>
  `,
})
class InnerLabelHost {
  readonly plain = createMockField({ name: 'plain' }).accessor;
  readonly affixed = createMockField({ name: 'affixed' }).accessor;
  readonly skin = signal<Skin>('fill');
  readonly density = signal<Density>('comfortable');
  readonly touch = signal<'on' | null>(null);
}

let mountedRoot: HTMLElement | null = null;

// A toolbar lines bare fields up in a wrapping flex row. The bare width is the
// container's call: 100% by default (a cell), a token value on the toolbar.
@Component({
  selector: 'cngx-field-box-toolbar-host',
  standalone: true,
  imports: [CngxFieldBox, CngxInput],
  styleUrls: HARNESS_STYLES,
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (width of widths; track width) {
      <div
        [class]="width ? 'bar sized' : 'bar'"
        style="display: flex; flex-wrap: wrap; gap: 8px; inline-size: 800px"
        [style.--cngx-field-bare-inline-size]="width"
      >
        <span cngxFieldBox skin="bare" class="t-box"><input cngxInput /></span>
        <input cngxInput skin="bare" class="t-lone" />
      </div>
    }
  `,
})
class ToolbarHost {
  readonly widths: readonly (string | null)[] = [null, '16rem'];
}

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(AffixHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const row = mountedRoot.querySelector('.cngx-field-box');
  if (!row) {
    throw new Error('field box did not render');
  }
  return row as HTMLElement;
}

function mountPatterns(): HTMLElement {
  mount();
  const row = mountedRoot!.querySelector('.patterns');
  if (!row) {
    throw new Error('field box pattern row did not render');
  }
  return row as HTMLElement;
}

function mountMatrix(skin: Skin, density: Density, touch: boolean): HTMLElement {
  const fixture = TestBed.createComponent(MatrixHost);
  fixture.componentInstance.skin.set(skin);
  fixture.componentInstance.density.set(density);
  fixture.componentInstance.touch.set(touch ? 'on' : null);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function mountInnerLabel(skin: Skin, density: Density, touch: boolean): HTMLElement {
  const fixture = TestBed.createComponent(InnerLabelHost);
  fixture.componentInstance.skin.set(skin);
  fixture.componentInstance.density.set(density);
  fixture.componentInstance.touch.set(touch ? 'on' : null);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function mountInert(): HTMLElement {
  const fixture = TestBed.createComponent(InertHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
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

// The tallest line in the box. A lone control is its own line; a box's line is
// the tallest line among its direct children. An icon-only affix is skipped:
// the glyph is a gauge that follows text scale, not a line box, and it
// stretches to the row anyway.
function lineBox(box: HTMLElement): number {
  if (!box.classList.contains('cngx-field-box')) {
    return px(box, 'line-height');
  }
  const lines = Array.from(box.children)
    .filter((child) => child.querySelector('cngx-icon') === null)
    .map((child) => px(child, 'line-height'));
  return Math.max(...lines);
}

function formula(box: HTMLElement): number {
  return lineBox(box) + px(box, 'padding-top') + px(box, 'padding-bottom') + 2;
}

function expectedHeight(box: HTMLElement): number {
  return Math.max(formula(box), px(box, 'min-height'));
}

const PADDING: Readonly<Record<Density, number>> = { comfortable: 8, compact: 4, spacious: 12 };

const CASES: readonly [string, (root: HTMLElement) => HTMLElement][] = [
  ['input', (root) => query(root, '.c-input')],
  ['textarea rows=1', (root) => query(root, '.c-textarea')],
  ['box with a text affix', (root) => query(root, '.c-text-affix')],
  ['box with an icon button', (root) => query(root, '.c-icon-button')],
  ['box with a text button', (root) => query(root, '.c-text-button')],
  ['box with a nested cngx-select', (root) => query(root, '.c-nested-select')],
  ['single trigger', (root) => query(root, '.c-single .cngx-field-trigger')],
  ['chip trigger', (root) => query(root, '.c-chips .cngx-field-trigger')],
];

const MATRIX = (['outline', 'fill', 'bare'] as const).flatMap((skin) =>
  (['comfortable', 'compact', 'spacious'] as const).flatMap((density) =>
    [false, true].map((touch) => [skin, density, touch] as const),
  ),
);

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxFieldBox geometry', () => {
  it('lays the affixes and control on one flex line', () => {
    const row = mount();
    expect(computedValue(row, 'display')).toBe('inline-flex');
    expect(computedValue(row, 'align-items')).toBe('center');
  });

  it('grows the control and pins the affixes intrinsic', () => {
    const row = mount();
    const input = query(row, 'input');
    expect(computedValue(input, 'flex-grow')).toBe('1');
    expect(computedValue(input, 'min-inline-size')).toBe('0px');
    expect(computedValue(query(row, '.cngx-field-prefix'), 'flex-grow')).toBe('0');
  });

  it('sizes the interactive affix to the box line instead of a standalone floor', () => {
    const row = mountPatterns();
    const button = query(row, '.cngx-field-affix--interactive');
    // Inside the box the floor is --cngx-target-min minus padding and border,
    // which is 0px on the fine pointer the headless run reports; the button
    // stretches to the line box and never pushes the box past its formula.
    expect(computedValue(button, 'min-height')).toBe('0px');
    expect(computedValue(button, 'align-self')).toBe('stretch');
    expect(computedValue(button, 'justify-content')).toBe('center');
  });

  it('drives the decorative glyph through the CngxIcon size and colour knobs', () => {
    const icon = query(mountPatterns(), 'cngx-icon');
    // The affix rule owns the assignment, not the geometry: CngxIcon reads
    // these two knobs on its own host, which is the element this rule
    // targets. Asserting the resolved gauge keeps the contract on the affix
    // side without re-testing the icon's internal cascade.
    expect(computedValue(icon, '--cngx-field-affix-icon-size')).toBe('1.25em');
    expect(computedValue(icon, '--cngx-icon-color')).not.toBe('');
  });
});

describe.each(MATRIX)('field box matrix: %s skin, %s, touch %s', (skin, density, touch) => {
  it.each(CASES)('%s measures line box + 2 * padding + 2px border', (_name, pick) => {
    const box = pick(mountMatrix(skin, density, touch));
    expect(box.getBoundingClientRect().height).toBeCloseTo(expectedHeight(box), 0);
    expect(px(box, 'padding-top')).toBe(PADDING[density]);
    expect(px(box, 'padding-bottom')).toBe(PADDING[density]);
    expect(px(box, 'border-top-width')).toBe(1);
    expect(px(box, 'border-bottom-width')).toBe(1);
    if (touch) {
      expect(box.getBoundingClientRect().height).toBeGreaterThanOrEqual(44 - 0.5);
    }
  });

  it.each(CASES.filter(([name]) => name.startsWith('box')))(
    '%s strips the nested controls and keeps every child inside the box',
    (_name, pick) => {
      const box = pick(mountMatrix(skin, density, touch));
      const content =
        box.getBoundingClientRect().height - px(box, 'padding-top') - px(box, 'padding-bottom') - 2;
      for (const control of Array.from(box.querySelectorAll(':scope > input'))) {
        expect(computedValue(control, 'padding-top')).toBe('0px');
      }
      for (const trigger of Array.from(box.querySelectorAll('.cngx-field-trigger'))) {
        expect(computedValue(trigger, 'padding-top')).toBe('0px');
        expect(computedValue(trigger, 'border-top-width')).toBe('0px');
      }
      for (const child of Array.from(box.children)) {
        expect(child.getBoundingClientRect().height).toBeLessThanOrEqual(content + 0.5);
      }
    },
  );

  it('keeps an interactive affix as tall as the line box', () => {
    const root = mountMatrix(skin, density, touch);
    for (const selector of ['.c-icon-button', '.c-text-button']) {
      const box = query(root, selector);
      const button = query(box, 'button');
      expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(lineBox(box) - 0.5);
      expect(box.getBoundingClientRect().height).toBeCloseTo(expectedHeight(box), 0);
    }
  });
});

// The literal contract rides on the 1rem control font: a 24px line box in
// every control, so every composition lands on the same number.
const LITERAL: Readonly<Record<Density, readonly [number, number]>> = {
  comfortable: [42, 44],
  compact: [34, 44],
  spacious: [50, 50],
};

describe.each(MATRIX)('field box literal sizes: %s skin, %s, touch %s', (skin, density, touch) => {
  it.each(CASES)('%s measures the contract height', (_name, pick) => {
    const box = pick(mountMatrix(skin, density, touch));
    const [fine, coarse] = LITERAL[density];
    expect(box.getBoundingClientRect().height).toBeCloseTo(touch ? coarse : fine, 0);
  });

  it('gives an interactive affix at least a 24 x 24 target and 44px wide on touch', () => {
    const root = mountMatrix(skin, density, touch);
    for (const selector of ['.c-icon-button', '.c-text-button']) {
      const rect = query(query(root, selector), 'button').getBoundingClientRect();
      expect(rect.height).toBeGreaterThanOrEqual(24 - 0.5);
      expect(rect.width).toBeGreaterThanOrEqual((touch ? 44 : 32) - 0.5);
    }
  });
});

// The border width is a token the formula and the touch floor both read, so a
// theme that thickens it keeps every box on its formula and on 44 under touch.
describe('field box border token', () => {
  it.each([false, true])('keeps a 2px border box on its formula (touch %s)', (touch) => {
    const root = mountMatrix('outline', 'comfortable', touch);
    root.style.setProperty('--cngx-field-border-width', '2px');
    const box = query(root, '.c-text-affix');
    expect(px(box, 'border-top-width')).toBe(2);
    const formula = lineBox(box) + px(box, 'padding-top') + px(box, 'padding-bottom') + 4;
    expect(box.getBoundingClientRect().height).toBeCloseTo(touch ? 44 : formula, 0);
  });
});

// The divider padding is a clamp trick (width * 1000, capped at space-sm);
// only a render proves 0px stays 0 and any width lands on space-sm, on a
// text affix and on an interactive one whose own padding it must not erase.
describe('field box affix divider', () => {
  it('draws no divider and adds no padding at the 0px default', () => {
    const row = mountPatterns();
    const prefix = query(row, '.cngx-field-prefix');
    const suffix = query(row, '.cngx-field-suffix');
    expect(px(prefix, 'border-right-width')).toBe(0);
    expect(px(prefix, 'padding-right')).toBe(0);
    expect(px(suffix, 'border-left-width')).toBe(0);
    expect(px(suffix, 'padding-left')).toBe(4);
  });

  it('draws the divider and pads both affix kinds by space-sm at 1px', () => {
    const row = mountPatterns();
    row.style.setProperty('--cngx-field-affix-divider', '1px');
    const prefix = query(row, '.cngx-field-prefix');
    const suffix = query(row, '.cngx-field-suffix');
    expect(px(prefix, 'border-right-width')).toBe(1);
    expect(px(prefix, 'padding-right')).toBe(8);
    expect(px(suffix, 'border-left-width')).toBe(1);
    expect(px(suffix, 'padding-left')).toBe(8);
    expect(px(suffix, 'padding-right')).toBe(4);
  });
});

// A bare select paints no box, so it sizes to its content, standalone and
// inside a field box alike.
describe('bare select width', () => {
  it('drops the minimum width and sizes to its content when standalone', () => {
    const root = mountMatrix('bare', 'comfortable', false);
    const host = query(root, '.c-single');
    expect(computedValue(host, 'min-width')).toBe('0px');
    const container = host.parentElement!.getBoundingClientRect().width;
    expect(host.getBoundingClientRect().width).toBeLessThan(160);
    expect(host.getBoundingClientRect().width).toBeLessThan(container);
  });

  it.each(['outline', 'fill', 'bare'] as const)(
    'lets a select nested in a %s box hug its content',
    (skin) => {
      const host = query(mountMatrix(skin, 'comfortable', false), '.c-nested-select cngx-select');
      expect(computedValue(host, 'min-width')).toBe('0px');
      expect(host.getBoundingClientRect().width).toBeLessThan(160);
    },
  );

  it('keeps the minimum width on an outline select', () => {
    const host = query(mountMatrix('outline', 'comfortable', false), '.c-single');
    expect(computedValue(host, 'min-width')).toBe('160px');
  });
});

describe('field box textarea', () => {
  it.each(['outline', 'fill', 'bare'] as const)(
    'grows a default two-row %s textarea by exactly one line box',
    (skin) => {
      const textarea = query(mountMatrix(skin, 'comfortable', false), '.c-textarea-default');
      expect(textarea.getBoundingClientRect().height).toBeCloseTo(
        formula(textarea) + lineBox(textarea),
        0,
      );
    },
  );
});

describe('field box inert nested controls', () => {
  const STATES = ['invalid-input', 'disabled-input', 'invalid-select', 'disabled-select'] as const;
  const SKINS = ['outline', 'fill', 'bare'] as const;
  const PAIRS = SKINS.flatMap((skin) => STATES.map((state) => [state, skin] as const));

  it.each(PAIRS)('paints a %s only on the %s box', (state, skin) => {
    const box = query(mountInert(), `.${state}[data-case='${skin}']`);
    const nested = state.endsWith('select')
      ? query(box, '.cngx-field-trigger')
      : query(box, ':scope > input');
    const flag = state.startsWith('invalid') ? 'data-invalid' : 'data-disabled';
    expect(box.hasAttribute(flag)).toBe(true);
    expect(computedValue(nested, 'color')).toBe(computedValue(box, 'color'));
    expect(computedValue(nested, 'outline-style')).toBe('none');
    expect(computedValue(nested, 'border-bottom-style')).toBe('none');
    expect(computedValue(nested, 'border-top-width')).toBe('0px');
  });
});

// The box formula with a 14px label line on top of the 24px value line. The
// label line is subtracted from the controls' touch floor, so a coarse pointer
// adds nothing to a box that is already past 44px.
const INNER_LABEL: Readonly<Record<Density, number>> = {
  comfortable: 56,
  compact: 48,
  spacious: 64,
};

describe.each(MATRIX)('field box inner label: %s skin, %s, touch %s', (skin, density, touch) => {
  it.each(['.l-plain', '.l-affixed'])(
    '%s stacks a 14px label over a 24px value line',
    (selector) => {
      const box = query(mountInnerLabel(skin, density, touch), selector);
      const label = query(box, ':scope > .cngx-label');
      const input = query(box, ':scope > input');
      expect(box.getBoundingClientRect().height).toBeCloseTo(INNER_LABEL[density], 0);
      expect(label.getBoundingClientRect().height).toBeCloseTo(14, 0);
      expect(input.getBoundingClientRect().height).toBeCloseTo(24, 0);
      expect(label.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        input.getBoundingClientRect().top + 0.5,
      );
      for (const child of Array.from(box.children)) {
        if (child !== label) {
          expect(child.getBoundingClientRect().top).toBeGreaterThanOrEqual(
            label.getBoundingClientRect().bottom - 0.5,
          );
        }
      }
    },
  );
});

describe('field box inner label placement', () => {
  // The label line comes out of the button's block floor, so on a coarse
  // pointer the button spans the value line instead of growing the box: at
  // least 24 x 24 (WCAG 2.5.8 AA) and the 44px inline floor.
  it.each([false, true])('keeps the interactive affix at 24px or more (touch %s)', (touch) => {
    const box = query(mountInnerLabel('fill', 'comfortable', touch), '.l-affixed');
    const rect = query(box, ':scope > button').getBoundingClientRect();
    expect(rect.height).toBeGreaterThanOrEqual(24 - 0.5);
    expect(rect.width).toBeGreaterThanOrEqual((touch ? 44 : 32) - 0.5);
    expect(box.getBoundingClientRect().height).toBeCloseTo(56, 0);
  });

  it('spans the label over the whole box width and keeps the value line on one row', () => {
    const box = query(mountInnerLabel('fill', 'comfortable', false), '.l-affixed');
    const label = query(box, ':scope > .cngx-label');
    const content = box.getBoundingClientRect().width - px(box, 'padding-left') * 2 - 2;
    expect(label.getBoundingClientRect().width).toBeCloseTo(content, 0);
    const tops = Array.from(box.children)
      .filter((child) => child !== label)
      .map((child) => Math.round(child.getBoundingClientRect().top));
    expect(new Set(tops).size).toBe(1);
  });

  // The line follows the label size, so an override grows the box instead of
  // pushing label glyphs into the value line.
  it('derives the inner label line from the label font size', () => {
    const box = query(mountInnerLabel('fill', 'comfortable', false), '.l-plain');
    box.style.setProperty('--cngx-field-label-font-size', '1rem');
    const label = query(box, ':scope > .cngx-label');
    const input = query(box, ':scope > input');
    expect(computedValue(label, 'line-height')).toBe('17px');
    expect(box.getBoundingClientRect().height).toBeCloseTo(59, 0);
    expect(label.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      input.getBoundingClientRect().top + 0.5,
    );
  });

  it('sets the inner label as 13px text on a 14px line', () => {
    const label = query(mountInnerLabel('fill', 'comfortable', false), '.l-plain > .cngx-label');
    expect(computedValue(label, 'font-size')).toBe('13px');
    expect(computedValue(label, 'line-height')).toBe('14px');
  });
});

describe('bare field width token', () => {
  function mountToolbar(): HTMLElement {
    const fixture = TestBed.createComponent(ToolbarHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    return mountedRoot;
  }

  it('fills its container by default, so bare fields in a wrapping row stack', () => {
    const bar = query(mountToolbar(), '.bar:not(.sized)');
    const box = query(bar, '.t-box');
    const lone = query(bar, '.t-lone');
    expect(box.getBoundingClientRect().width).toBeCloseTo(800, 0);
    expect(lone.getBoundingClientRect().width).toBeCloseTo(800, 0);
    expect(lone.getBoundingClientRect().top).toBeGreaterThan(box.getBoundingClientRect().top);
  });

  it('takes the container token, so a toolbar lines bare fields up on one row', () => {
    const bar = query(mountToolbar(), '.bar.sized');
    const box = query(bar, '.t-box');
    const lone = query(bar, '.t-lone');
    expect(box.getBoundingClientRect().width).toBeCloseTo(256, 0);
    expect(lone.getBoundingClientRect().width).toBeCloseTo(256, 0);
    expect(lone.getBoundingClientRect().top).toBeCloseTo(box.getBoundingClientRect().top, 0);
  });
});
