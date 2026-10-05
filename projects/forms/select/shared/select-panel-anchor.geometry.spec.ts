import { Component, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideDirection } from '@cngx/core';
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
import { CngxSelectInputPrefix } from './template-slots';

// Runs in a real Chromium (the `test-geometry` target). Every select variant
// opens its panel flush with its bordered `.cngx-field-trigger` row. The four
// input variants carry the popover trigger on the inner <input>, which a
// prefix template insets; `CngxPopoverAnchor` on the row keeps the panel on
// the row, not on the input.
//
// The harness is ViewEncapsulation.None with the reset in `styleUrls`: the
// shipped contract is `cngx.css`, whose `box-sizing: border-box` must reach
// the top-layer panel. Without it the content-box panel adds padding + border
// on top of `min-width: anchor-size(width)` and every variant reads wider.
//
// The default placement `'bottom'` centres the panel (`bottom span-all`), so
// the left-edge check holds because the panel width equals the row width;
// option labels stay shorter than the row to keep that exact. The bare skin
// and the affix-row nesting are out of scope: there the visible border
// belongs to the surrounding row, not to `.cngx-field-trigger`.

const HARNESS_STYLES = [
  '../../../core/theming/layers.css',
  '../../../core/theming/system-tokens.css',
  '../../../core/theming/reset.css',
  '../../../core/theming/base.css',
  '../../theming/components/cngx-field-affix.css',
  '../../theming/components/cngx-field-skin.css',
  './select-base.css',
];

type Variant =
  | 'select'
  | 'multi'
  | 'combobox'
  | 'typeahead'
  | 'tree'
  | 'reorder'
  | 'action'
  | 'action-multi'
  | 'shell';

const VARIANTS: readonly Variant[] = [
  'select',
  'multi',
  'combobox',
  'typeahead',
  'tree',
  'reorder',
  'action',
  'action-multi',
  'shell',
];
const INPUT_VARIANTS: readonly Variant[] = ['combobox', 'typeahead', 'action', 'action-multi'];

interface Openable {
  open(): void;
}

@Component({
  selector: 'cngx-select-panel-anchor-host',
  standalone: true,
  imports: [
    CngxSelect,
    CngxMultiSelect,
    CngxCombobox,
    CngxTypeahead,
    CngxTreeSelect,
    CngxReorderableMultiSelect,
    CngxActionSelect,
    CngxActionMultiSelect,
    CngxSelectShell,
    CngxSelectOption,
    CngxSelectInputPrefix,
  ],
  styleUrls: HARNESS_STYLES,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="slot" style="display: block; width: 20rem; margin: 1rem">
      @switch (variant()) {
        @case ('select') {
          <cngx-select #v [skin]="skin()" [label]="'C'" [options]="options" />
        }
        @case ('multi') {
          <cngx-multi-select #v [skin]="skin()" [label]="'C'" [options]="options" />
        }
        @case ('combobox') {
          <cngx-combobox #v [skin]="skin()" [label]="'C'" [options]="options">
            <ng-template cngxSelectInputPrefix
              ><span class="pfx" style="display: inline-block; width: 2rem">@</span></ng-template
            >
          </cngx-combobox>
        }
        @case ('typeahead') {
          <cngx-typeahead #v [skin]="skin()" [label]="'C'" [options]="options">
            <ng-template cngxSelectInputPrefix
              ><span class="pfx" style="display: inline-block; width: 2rem">@</span></ng-template
            >
          </cngx-typeahead>
        }
        @case ('tree') {
          <cngx-tree-select #v [skin]="skin()" [label]="'C'" [nodes]="nodes" [nodeIdFn]="nodeId" />
        }
        @case ('reorder') {
          <cngx-reorderable-multi-select #v [skin]="skin()" [label]="'C'" [options]="options" />
        }
        @case ('action') {
          <cngx-action-select #v [skin]="skin()" [label]="'C'" [options]="options">
            <ng-template cngxSelectInputPrefix
              ><span class="pfx" style="display: inline-block; width: 2rem">@</span></ng-template
            >
          </cngx-action-select>
        }
        @case ('action-multi') {
          <cngx-action-multi-select #v [skin]="skin()" [label]="'C'" [options]="options">
            <ng-template cngxSelectInputPrefix
              ><span class="pfx" style="display: inline-block; width: 2rem">@</span></ng-template
            >
          </cngx-action-multi-select>
        }
        @case ('shell') {
          <cngx-select-shell #v [skin]="skin()" [label]="'C'">
            <cngx-option [value]="'red'">Red</cngx-option>
            <cngx-option [value]="'green'">Green</cngx-option>
          </cngx-select-shell>
        }
      }
    </div>
  `,
})
class VariantHost {
  readonly variant = signal<Variant>('select');
  readonly skin = signal<'outline' | 'fill' | undefined>(undefined);
  readonly options = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
  ];
  readonly nodes = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
  ];
  readonly nodeId = (value: unknown): string => String(value);
  readonly select = viewChild.required<Openable>('v');
}

// One option wider than the row, so the panel outgrows its min-width and the
// start / end alignment of `bottom-start` becomes observable.
@Component({
  selector: 'cngx-select-panel-anchor-rtl-host',
  standalone: true,
  imports: [CngxActionSelect, CngxSelectInputPrefix],
  styleUrls: HARNESS_STYLES,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="slot" style="display: block; width: 20rem; margin: 1rem 30rem">
      <cngx-action-select #v popoverPlacement="bottom-start" [label]="'C'" [options]="options">
        <ng-template cngxSelectInputPrefix
          ><span class="pfx" style="display: inline-block; width: 2rem">@</span></ng-template
        >
      </cngx-action-select>
    </div>
  `,
})
class PlacementHost {
  readonly options = [
    { value: 'short', label: 'Short' },
    {
      value: 'long',
      label: 'A considerably longer option label that outgrows the field row',
    },
  ];
  readonly select = viewChild.required<Openable>('v');
}

let mountedRoot: HTMLElement | null = null;

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('dir');
});

async function nextFrame(): Promise<void> {
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
}

async function openAndMeasure<T extends { select(): Openable }>(fixture: {
  componentInstance: T;
  nativeElement: HTMLElement;
  detectChanges(): void;
}) {
  fixture.componentInstance.select().open();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  await nextFrame();
  const root = fixture.nativeElement;
  const row = root.querySelector('.cngx-field-trigger') as HTMLElement;
  const panel = root.querySelector('.cngx-select__panel') as HTMLElement;
  expect(panel.matches(':popover-open')).toBe(true);
  return {
    row,
    panel,
    rowRect: row.getBoundingClientRect(),
    panelRect: panel.getBoundingClientRect(),
  };
}

function mount<T>(type: new () => T) {
  const fixture = TestBed.createComponent(type);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  return fixture;
}

describe('select panel anchor geometry', () => {
  for (const skin of [undefined, 'outline', 'fill'] as const) {
    describe(`skin ${skin ?? 'default'}`, () => {
      for (const variant of VARIANTS) {
        it(`${variant}: panel is flush with the bordered trigger row`, async () => {
          const fixture = mount(VariantHost);
          fixture.componentInstance.variant.set(variant);
          fixture.componentInstance.skin.set(skin);
          fixture.detectChanges();
          TestBed.flushEffects();
          fixture.detectChanges();

          const { rowRect, panelRect } = await openAndMeasure(fixture);
          expect(Math.abs(panelRect.left - rowRect.left)).toBeLessThanOrEqual(1);
          expect(Math.abs(panelRect.width - rowRect.width)).toBeLessThanOrEqual(1);
        });
      }
    });
  }

  for (const variant of INPUT_VARIANTS) {
    it(`${variant}: the row carries the anchor-name, the inset input yields it`, async () => {
      const fixture = mount(VariantHost);
      fixture.componentInstance.variant.set(variant);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();

      const { row } = await openAndMeasure(fixture);
      const input = row.querySelector('[role="combobox"]') as HTMLElement;
      expect(computedValue(row, 'anchor-name')).toMatch(/^--cngx-pop-/);
      expect(computedValue(input, 'anchor-name')).toBe('none');
      expect(input.getBoundingClientRect().left - row.getBoundingClientRect().left).toBeGreaterThan(
        10,
      );
    });
  }

  // `bottom-start` keeps the popover's all-sides offset margin, so the panel's
  // aligned edge sits that margin inside the row's edge on both engines'
  // CSS-anchor path. The assertions subtract it instead of pinning 8px.
  it('bottom-start aligns the wider panel to the row start in LTR', async () => {
    const fixture = mount(PlacementHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const { panel, rowRect, panelRect } = await openAndMeasure(fixture);
    const margin = parseFloat(getComputedStyle(panel).marginLeft);
    expect(panelRect.width).toBeGreaterThan(rowRect.width + 2);
    expect(Math.abs(panelRect.left - margin - rowRect.left)).toBeLessThanOrEqual(1);
  });

  it('bottom-start aligns the wider panel to the row end in RTL', async () => {
    document.documentElement.setAttribute('dir', 'rtl');
    TestBed.configureTestingModule({ providers: [provideDirection('rtl')] });
    const fixture = mount(PlacementHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const { panel, rowRect, panelRect } = await openAndMeasure(fixture);
    const margin = parseFloat(getComputedStyle(panel).marginRight);
    expect(panelRect.width).toBeGreaterThan(rowRect.width + 2);
    expect(Math.abs(rowRect.right - margin - panelRect.right)).toBeLessThanOrEqual(1);
  });
});
