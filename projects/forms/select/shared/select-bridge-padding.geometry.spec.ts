import { CUSTOM_ELEMENTS_SCHEMA, Component, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
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

// Runs in a real Chromium (the `test-geometry` target) against the working-tree
// select bridge (`./select-bridge-padding.spec-host.scss`). Material 3 menus
// sit their rows edge-to-edge inside an 8px block inset: the bridge zeroes the
// panel padding, moves the 8px onto the list (listbox or tree) and gives a
// tree row the 16px end padding of an option row. The component stylesheets
// SET the same tokens from the scale on those elements, so the bridge values
// must carry element specificity to land.
//
// The static-markup block pins the token outcome per element; the composite
// block below opens the real panels and measures what draws the gap and the
// inset, the way mat-select reads next to them in the material lab: no gap
// under the field row, 8px from the panel edge to the first row, and rows as
// wide as the panel.

// Static markup in the composites' host elements: the panel and the tree
// render inside the select host, whose element the bridge keys on.
const TEMPLATE = `
  <cngx-select>
    <div class="cngx-select__panel panel">
      <div class="cngx-select__option">Red</div>
    </div>
  </cngx-select>
  <cngx-tree-select>
    <cngx-tree-select-panel>
      <div class="cngx-tree-select__tree tree">
        <div class="cngx-tree-select__node node">Alpha</div>
      </div>
    </cngx-tree-select-panel>
  </cngx-tree-select>
`;

const BASE_STYLES = [
  '../../../core/theming/layers.css',
  '../../../core/theming/system-tokens.css',
  './select-base.css',
  '../tree-select/tree-select-panel.component.css',
];

@Component({
  selector: 'cngx-select-bridge-padding-host',
  standalone: true,
  styleUrls: [...BASE_STYLES, './select-bridge-padding.spec-host.scss'],
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: TEMPLATE,
})
class BridgedHost {}

@Component({
  selector: 'cngx-select-default-padding-host',
  standalone: true,
  styleUrls: BASE_STYLES,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: TEMPLATE,
})
class DefaultHost {}

let mountedRoot: HTMLElement | null = null;

function mount(host: new () => unknown): HTMLElement {
  const fixture = TestBed.createComponent(host);
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

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('select Material bridge panel and tree padding', () => {
  it('keeps the scale insets without the bridge', () => {
    const root = mount(DefaultHost);
    expect(computedValue(one(root, '.panel'), 'padding-top')).toBe('4px');
    expect(computedValue(one(root, '.tree'), 'padding-top')).toBe('4px');
    expect(computedValue(one(root, '.node'), 'padding-inline-end')).toBe('8px');
  });

  it('zeroes the panel padding under the bridge', () => {
    const root = mount(BridgedHost);
    const panel = one(root, '.panel');
    expect(computedValue(panel, 'padding-top')).toBe('0px');
    expect(computedValue(panel, 'padding-left')).toBe('0px');
  });

  it('gives the tree the 8px block inset and no inline inset under the bridge', () => {
    const root = mount(BridgedHost);
    const tree = one(root, '.tree');
    expect(computedValue(tree, 'padding-top')).toBe('8px');
    expect(computedValue(tree, 'padding-bottom')).toBe('8px');
    expect(computedValue(tree, 'padding-left')).toBe('0px');
    expect(computedValue(tree, 'padding-right')).toBe('0px');
  });

  it('gives a tree node the 16px option end padding under the bridge', () => {
    const root = mount(BridgedHost);
    expect(computedValue(one(root, '.node'), 'padding-inline-end')).toBe('16px');
  });
});

// The shipped contract is cngx.css plus the listbox sheet, whose
// `[cngxListbox]` rule SETs the listbox padding the bridge must outrank.
const COMPOSITE_STYLES = [
  '../../../core/theming/layers.css',
  '../../../core/theming/system-tokens.css',
  '../../../core/theming/density-tokens.css',
  '../../../core/theming/reset.css',
  '../../../core/theming/base.css',
  '../../../common/theming/components/cngx-listbox.css',
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

interface Openable {
  open(): void;
}

const COMPOSITE_TEMPLATE = `
  <div
    class="slot"
    style="display: block; width: 20rem; margin: 1rem; --cngx-tree-select-panel-min-inline-size: 0px"
  >
    @switch (variant()) {
      @case ('select') {
        <cngx-select #v [label]="'C'" [options]="options" />
      }
      @case ('multi') {
        <cngx-multi-select #v [label]="'C'" [options]="options" />
      }
      @case ('combobox') {
        <cngx-combobox #v [label]="'C'" [options]="options" />
      }
      @case ('typeahead') {
        <cngx-typeahead #v [label]="'C'" [options]="options" />
      }
      @case ('tree') {
        <cngx-tree-select #v [label]="'C'" [nodes]="nodes" [nodeIdFn]="nodeId" />
      }
      @case ('reorder') {
        <cngx-reorderable-multi-select #v [label]="'C'" [options]="options" />
      }
      @case ('action') {
        <cngx-action-select #v [label]="'C'" [options]="options" />
      }
      @case ('action-multi') {
        <cngx-action-multi-select #v [label]="'C'" [options]="options" />
      }
      @case ('shell') {
        <cngx-select-shell #v [label]="'C'">
          <cngx-option [value]="'red'">Red</cngx-option>
          <cngx-option [value]="'green'">Green</cngx-option>
        </cngx-select-shell>
      }
    }
  </div>
`;

const COMPOSITES = [
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
];

const COMPOSITE_OPTIONS = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
];

@Component({
  selector: 'cngx-select-bridge-composite-host',
  standalone: true,
  imports: COMPOSITES,
  styleUrls: [...COMPOSITE_STYLES, './select-bridge-padding.spec-host.scss'],
  encapsulation: ViewEncapsulation.None,
  template: COMPOSITE_TEMPLATE,
})
class BridgedCompositeHost {
  readonly variant = signal<Variant>('select');
  readonly options = COMPOSITE_OPTIONS;
  readonly nodes = COMPOSITE_OPTIONS;
  readonly nodeId = (value: unknown): string => String(value);
}

@Component({
  selector: 'cngx-select-default-composite-host',
  standalone: true,
  imports: COMPOSITES,
  styleUrls: COMPOSITE_STYLES,
  encapsulation: ViewEncapsulation.None,
  template: COMPOSITE_TEMPLATE,
})
class DefaultCompositeHost {
  readonly variant = signal<Variant>('select');
  readonly options = COMPOSITE_OPTIONS;
  readonly nodes = COMPOSITE_OPTIONS;
  readonly nodeId = (value: unknown): string => String(value);
}

async function nextFrame(): Promise<void> {
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
}

async function openPanel(
  host: typeof BridgedCompositeHost | typeof DefaultCompositeHost,
  variant: Variant,
): Promise<{ row: DOMRect; panel: DOMRect; first: DOMRect }> {
  const fixture = TestBed.createComponent(host);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.componentInstance.variant.set(variant);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  (fixture.debugElement.query(By.css('.slot > *')).componentInstance as Openable).open();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  await nextFrame();
  const root = fixture.nativeElement as HTMLElement;
  const panel = one(root, '.cngx-select__panel');
  expect(panel.matches(':popover-open')).toBe(true);
  return {
    row: one(root, '.cngx-field-trigger').getBoundingClientRect(),
    panel: panel.getBoundingClientRect(),
    first: one(panel, "[role='option'], [role='treeitem']").getBoundingClientRect(),
  };
}

describe('select Material bridge panel geometry', () => {
  for (const variant of VARIANTS) {
    it(`${variant}: opens flush under the row with an 8px block inset and full-width rows`, async () => {
      const { row, panel, first } = await openPanel(BridgedCompositeHost, variant);
      expect(panel.top - row.bottom).toBeCloseTo(0, 0);
      expect(first.top - panel.top).toBeCloseTo(8, 0);
      expect(first.left - panel.left).toBeCloseTo(0, 0);
      expect(panel.right - first.right).toBeCloseTo(0, 0);
    });
  }

  // The default theme keeps its own anatomy: the popover offset under the
  // row and an inset around the rows.
  it('keeps the default gap and inset without the bridge', async () => {
    const { row, panel, first } = await openPanel(DefaultCompositeHost, 'select');
    expect(panel.top - row.bottom).toBeCloseTo(8, 0);
    expect(first.left - panel.left).toBeGreaterThan(0);
  });
});
