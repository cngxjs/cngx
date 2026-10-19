import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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

// Runs in a real Chromium (the `test-geometry` target). Under the touch floor
// (`data-touch="on"`, the same 44px a coarse pointer sets) every empty select
// trigger row has one height. The four input variants embed a bare <input>
// that `base.css` lifts to the floor on its own; the row already carries the
// floor, so the inner input must not add the row padding on top of it.
//
// The same harness locks the trigger token chains. Each chain has a family
// token (`--cngx-select-*`) and per-variant tokens that fall back to it. The
// family token set on an ancestor reaches all nine rows. A variant token set
// on an ancestor repaints only the rows that read it: its own variant, plus
// the variant that chains through it (action-multi-select through the
// combobox token, reorderable-multi-select through the multi-select token).
// Tree-select's variant tokens carry a `trigger-` infix.

@Component({
  selector: 'cngx-select-touch-floor-host',
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
  ],
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    '../../../core/theming/reset.css',
    '../../../core/theming/base.css',
    '../../theming/components/cngx-field-affix.css',
    '../../theming/components/cngx-field-skin.css',
    './select-base.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div data-touch="on" style="display: block; width: 20rem; margin: 1rem">
      <cngx-select [label]="'C'" [options]="options" />
      <cngx-multi-select [label]="'C'" [options]="options" />
      <cngx-combobox [label]="'C'" [options]="options" />
      <cngx-typeahead [label]="'C'" [options]="options" />
      <cngx-tree-select [label]="'C'" [nodes]="options" [nodeIdFn]="nodeId" />
      <cngx-reorderable-multi-select [label]="'C'" [options]="options" />
      <cngx-action-select [label]="'C'" [options]="options" />
      <cngx-action-multi-select [label]="'C'" [options]="options" />
      <cngx-select-shell [label]="'C'">
        <cngx-option [value]="'red'">Red</cngx-option>
      </cngx-select-shell>
    </div>
  `,
})
class TouchFloorHost {
  readonly options = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
  ];
  readonly nodeId = (value: unknown): string => String(value);
}

const SET_COLOR = 'rgb(1, 2, 3)';

interface TokenChain {
  /** Computed style property painted on the trigger row. */
  readonly property: 'backgroundColor' | 'color' | 'borderTopColor' | 'outlineColor';
  /** The row only paints `property` while its combobox has focus. */
  readonly focus?: boolean;
  /** Value the tokens are set to; it paints `SET_COLOR` on `property`. */
  readonly value: string;
  readonly family: string;
  /** Each variant token and the hosts whose trigger row reads it. */
  readonly variants: readonly (readonly [string, readonly string[]])[];
}

const CHAINS: readonly TokenChain[] = [
  {
    property: 'backgroundColor',
    value: SET_COLOR,
    family: '--cngx-select-bg',
    variants: [
      ['--cngx-multi-select-bg', ['cngx-multi-select', 'cngx-reorderable-multi-select']],
      ['--cngx-combobox-bg', ['cngx-combobox', 'cngx-action-multi-select']],
      ['--cngx-typeahead-bg', ['cngx-typeahead']],
      ['--cngx-tree-select-trigger-bg', ['cngx-tree-select']],
      ['--cngx-reorderable-multi-select-bg', ['cngx-reorderable-multi-select']],
      ['--cngx-action-select-bg', ['cngx-action-select']],
      ['--cngx-action-multi-select-bg', ['cngx-action-multi-select']],
      ['--cngx-select-shell-bg', ['cngx-select-shell']],
    ],
  },
  {
    property: 'color',
    value: SET_COLOR,
    family: '--cngx-select-color',
    variants: [
      ['--cngx-multi-select-color', ['cngx-multi-select', 'cngx-reorderable-multi-select']],
      ['--cngx-combobox-color', ['cngx-combobox', 'cngx-action-multi-select']],
      ['--cngx-reorderable-multi-select-color', ['cngx-reorderable-multi-select']],
      ['--cngx-action-multi-select-color', ['cngx-action-multi-select']],
      ['--cngx-select-shell-color', ['cngx-select-shell']],
    ],
  },
  {
    property: 'borderTopColor',
    value: `1px solid ${SET_COLOR}`,
    family: '--cngx-select-border',
    variants: [
      ['--cngx-multi-select-border', ['cngx-multi-select', 'cngx-reorderable-multi-select']],
      ['--cngx-combobox-border', ['cngx-combobox', 'cngx-action-multi-select']],
      ['--cngx-typeahead-border', ['cngx-typeahead']],
      ['--cngx-tree-select-trigger-border', ['cngx-tree-select']],
      ['--cngx-reorderable-multi-select-border', ['cngx-reorderable-multi-select']],
      ['--cngx-action-select-border', ['cngx-action-select']],
      ['--cngx-action-multi-select-border', ['cngx-action-multi-select']],
      ['--cngx-select-shell-border', ['cngx-select-shell']],
    ],
  },
  {
    property: 'outlineColor',
    focus: true,
    value: `2px solid ${SET_COLOR}`,
    family: '--cngx-select-focus-outline',
    variants: [
      ['--cngx-multi-select-focus-outline', ['cngx-multi-select', 'cngx-reorderable-multi-select']],
      ['--cngx-combobox-focus-outline', ['cngx-combobox', 'cngx-action-multi-select']],
      ['--cngx-tree-select-focus-ring', ['cngx-tree-select']],
      ['--cngx-reorderable-multi-select-focus-outline', ['cngx-reorderable-multi-select']],
      ['--cngx-action-multi-select-focus-outline', ['cngx-action-multi-select']],
      ['--cngx-select-shell-focus-outline', ['cngx-select-shell']],
    ],
  },
];

let mountedRoot: HTMLElement | null = null;

function hostTag(row: HTMLElement): string | undefined {
  let el: HTMLElement | null = row.parentElement;
  while (el && !el.tagName.startsWith('CNGX-')) {
    el = el.parentElement;
  }
  return el?.tagName.toLowerCase();
}

function mountRows(): HTMLElement[] {
  const fixture = TestBed.createComponent(TouchFloorHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  const rows = Array.from(mountedRoot.querySelectorAll<HTMLElement>('.cngx-field-trigger'));
  expect(rows).toHaveLength(9);
  return rows;
}

// Reads `property` off every row; a focus chain focuses each row's combobox
// first, so the row's focus rule applies while it is read. Programmatic
// focus matches `:focus-visible` here; if it ever stopped matching, the
// family assertions fail rather than pass, since an unfocused row paints no
// ring.
function paints(
  rows: readonly HTMLElement[],
  chain: Pick<TokenChain, 'focus'> & {
    readonly property: TokenChain['property'] | 'outlineOffset';
  },
): string[] {
  return rows.map((row) => {
    if (!chain.focus) {
      return getComputedStyle(row)[chain.property];
    }
    const combobox = row.matches('[role="combobox"]')
      ? row
      : row.querySelector<HTMLElement>('[role="combobox"]')!;
    combobox.focus();
    const value = getComputedStyle(row)[chain.property];
    combobox.blur();
    return value;
  });
}

function setOnAncestor(token: string, value: string): void {
  mountedRoot!.querySelector<HTMLElement>('[data-touch]')!.style.setProperty(token, value);
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('select touch floor geometry', () => {
  it('every empty trigger row sits at the 44px floor, the input variants included', () => {
    for (const row of mountRows()) {
      const host = hostTag(row);
      expect({ host, height: Math.round(row.getBoundingClientRect().height) }).toEqual({
        host,
        height: 44,
      });
    }
  });

  it('every empty trigger row paints the same family background', () => {
    for (const row of mountRows()) {
      expect(getComputedStyle(row).backgroundColor, `${hostTag(row)} trigger row`).toBe(
        'rgba(0, 0, 0, 0)',
      );
    }
  });

  // Tree-select keeps its own 1px ring offset and does not read the token.
  it('--cngx-select-focus-offset set on an ancestor moves every focus ring but the tree', () => {
    const rows = mountRows();
    setOnAncestor('--cngx-select-focus-offset', '5px');
    const offsets = paints(rows, { property: 'outlineOffset', focus: true });
    offsets.forEach((offset, i) => {
      const host = hostTag(rows[i]);
      expect(offset, `${host} trigger row`).toBe(host === 'cngx-tree-select' ? '1px' : '5px');
    });
  });

  for (const chain of CHAINS) {
    const { value, family, variants } = chain;
    it(`${family} set on an ancestor reaches every trigger row`, () => {
      const rows = mountRows();
      setOnAncestor(family, value);
      paints(rows, chain).forEach((painted, i) => {
        expect(painted, `${hostTag(rows[i])} trigger row`).toBe(SET_COLOR);
      });
    });

    for (const [token, painted] of variants) {
      it(`${token} set on an ancestor repaints only ${painted.join(' + ')}`, () => {
        const rows = mountRows();
        const before = paints(rows, chain);
        setOnAncestor(token, value);
        paints(rows, chain).forEach((after, i) => {
          const host = hostTag(rows[i]) ?? '';
          const expected = painted.includes(host) ? SET_COLOR : before[i];
          expect(after, `${host} trigger row`).toBe(expected);
        });
      });
    }
  }
});
