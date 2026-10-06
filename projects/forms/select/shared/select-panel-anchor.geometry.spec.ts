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
import { CngxSelectAction, CngxSelectInputPrefix } from './template-slots';

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
    CngxSelectAction,
  ],
  styleUrls: HARNESS_STYLES,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="slot"
      style="display: block; width: 20rem; margin: 1rem"
      [style.--cngx-select-action-border]="actionBorder()"
    >
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
          <cngx-action-select
            #v
            [skin]="skin()"
            [label]="'C'"
            [options]="options"
            [actionPosition]="actionPosition()"
          >
            <ng-template cngxSelectInputPrefix
              ><span class="pfx" style="display: inline-block; width: 2rem">@</span></ng-template
            >
            @if (withAction()) {
              <ng-template cngxSelectAction><button type="button">Add</button></ng-template>
            }
          </cngx-action-select>
        }
        @case ('action-multi') {
          <cngx-action-multi-select
            #v
            [skin]="skin()"
            [label]="'C'"
            [options]="options"
            [actionPosition]="actionPosition()"
          >
            <ng-template cngxSelectInputPrefix
              ><span class="pfx" style="display: inline-block; width: 2rem">@</span></ng-template
            >
            @if (withAction()) {
              <ng-template cngxSelectAction><button type="button">Add</button></ng-template>
            }
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
  readonly withAction = signal(false);
  readonly actionPosition = signal<'top' | 'bottom'>('bottom');
  readonly actionBorder = signal<string | null>(null);
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

  // The popover offset sits on the main axis only, so a `bottom-start`
  // panel's aligned edge meets the row's edge exactly.
  it('bottom-start aligns the wider panel to the row start in LTR', async () => {
    const fixture = mount(PlacementHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const { rowRect, panelRect } = await openAndMeasure(fixture);
    expect(panelRect.width).toBeGreaterThan(rowRect.width + 2);
    expect(Math.abs(panelRect.left - rowRect.left)).toBeLessThanOrEqual(1);
  });

  it('bottom-start aligns the wider panel to the row end in RTL', async () => {
    document.documentElement.setAttribute('dir', 'rtl');
    TestBed.configureTestingModule({ providers: [provideDirection('rtl')] });
    const fixture = mount(PlacementHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const { rowRect, panelRect } = await openAndMeasure(fixture);
    expect(panelRect.width).toBeGreaterThan(rowRect.width + 2);
    expect(Math.abs(rowRect.right - panelRect.right)).toBeLessThanOrEqual(1);
  });
});

// The panel frame (surface, edges, gap, action-region separator) is one
// source of truth across the family; option and tree-row content is not
// locked. Every variant is compared against CngxSelect read in the same run,
// so value tuning stays free, and absolute floors catch a family-wide loss.
const FRAME_PROPS = [
  'box-shadow',
  'border-top-width',
  'border-top-style',
  'border-top-color',
  'border-right-width',
  'border-right-style',
  'border-right-color',
  'border-bottom-width',
  'border-bottom-style',
  'border-bottom-color',
  'border-left-width',
  'border-left-style',
  'border-left-color',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'background-color',
] as const;

const ACTION_FRAME_PROPS = [
  'border-block-start-width',
  'border-block-start-style',
  'border-block-start-color',
  'margin-block-start',
  'padding-block-start',
] as const;

interface HostSetup {
  readonly variant: Variant;
  readonly withAction?: boolean;
  readonly actionPosition?: 'top' | 'bottom';
  readonly actionBorder?: string | null;
}

async function openVariant(setup: HostSetup) {
  const fixture = mount(VariantHost);
  const host = fixture.componentInstance;
  host.variant.set(setup.variant);
  host.withAction.set(setup.withAction ?? false);
  host.actionPosition.set(setup.actionPosition ?? 'bottom');
  host.actionBorder.set(setup.actionBorder ?? null);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  const measured = await openAndMeasure(fixture);
  return { ...measured, root: fixture.nativeElement as HTMLElement };
}

function readFrame(el: HTMLElement, props: readonly string[]): Record<string, string> {
  return Object.fromEntries(props.map((prop) => [prop, computedValue(el, prop)]));
}

function actionRegion(root: HTMLElement, side: 'top' | 'bottom'): HTMLElement {
  const el = root.querySelector<HTMLElement>(`.cngx-select__action--${side}`);
  if (!el) {
    throw new Error(`.cngx-select__action--${side} did not render`);
  }
  return el;
}

describe('select panel frame', () => {
  it('select reference clears the absolute floors', async () => {
    const { panel } = await openVariant({ variant: 'select' });
    expect(computedValue(panel, 'box-shadow')).not.toBe('none');
    expect(computedValue(panel, 'background-color')).not.toBe('rgba(0, 0, 0, 0)');
    expect(parseFloat(computedValue(panel, 'border-top-left-radius'))).toBeGreaterThan(0);
  });

  for (const variant of VARIANTS) {
    it(`${variant}: panel frame equals the CngxSelect reference`, async () => {
      const reference = readFrame((await openVariant({ variant: 'select' })).panel, FRAME_PROPS);
      mountedRoot?.remove();
      const { panel, rowRect, panelRect } = await openVariant({ variant });
      expect(readFrame(panel, FRAME_PROPS)).toEqual(reference);
      expect(Math.abs(panelRect.top - rowRect.bottom - 8)).toBeLessThanOrEqual(1);
    });
  }

  it('action-select and action-multi-select share one action-region frame', async () => {
    const single = actionRegion(
      (await openVariant({ variant: 'action', withAction: true })).root,
      'bottom',
    );
    const singleFrame = readFrame(single, ACTION_FRAME_PROPS);
    mountedRoot?.remove();
    const multi = actionRegion(
      (await openVariant({ variant: 'action-multi', withAction: true })).root,
      'bottom',
    );
    expect(parseFloat(singleFrame['border-block-start-width'])).toBeGreaterThan(0);
    expect(singleFrame['border-block-start-style']).toBe('solid');
    expect(readFrame(multi, ACTION_FRAME_PROPS)).toEqual(singleFrame);
  });

  it('a top action carries the separator on its block-end side', async () => {
    const { root } = await openVariant({
      variant: 'action',
      withAction: true,
      actionPosition: 'top',
    });
    const top = actionRegion(root, 'top');
    expect(parseFloat(computedValue(top, 'border-block-end-width'))).toBeGreaterThan(0);
    expect(computedValue(top, 'border-block-start-style')).toBe('none');
  });

  it('drops the separator when the border token is none', async () => {
    const { root } = await openVariant({
      variant: 'action-multi',
      withAction: true,
      actionBorder: 'none',
    });
    expect(computedValue(actionRegion(root, 'bottom'), 'border-block-start-style')).toBe('none');
  });
});
