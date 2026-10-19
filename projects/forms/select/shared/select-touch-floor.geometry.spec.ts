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
// Tree-select's variant tokens carry a `trigger-` infix. The layout chains
// follow the same shape; their values stay above the 44px floor so the floor
// does not mask them.

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

// Hosts for the tokens read below the trigger row: the shell label slot, the
// inline input of the two input-led multi variants, and the tree-select
// clear-all button (rendered once clearable and a value is selected).
@Component({
  selector: 'cngx-select-inner-tokens-host',
  standalone: true,
  imports: [CngxCombobox, CngxTreeSelect, CngxActionMultiSelect, CngxSelectShell, CngxSelectOption],
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
    <div style="display: block; width: 20rem; margin: 1rem">
      <cngx-combobox [label]="'C'" [options]="options" />
      <cngx-action-multi-select [label]="'C'" [options]="options" />
      <cngx-tree-select
        [label]="'C'"
        [nodes]="options"
        [nodeIdFn]="nodeId"
        [clearable]="true"
        [values]="['red']"
      />
      <cngx-select-shell [label]="'C'">
        <cngx-option [value]="'red'">Red</cngx-option>
      </cngx-select-shell>
    </div>
  `,
})
class InnerTokensHost {
  readonly options = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
  ];
  readonly nodeId = (value: unknown): string => String(value);
}

interface InnerToken {
  readonly token: string;
  readonly value: string;
  readonly property: 'columnGap' | 'minWidth' | 'flexBasis' | 'inlineSize';
  /** Every element whose `property` the group reads. */
  readonly sites: readonly string[];
  /** The sites `token` repaints. */
  readonly reaches: readonly string[];
}

const COMBOBOX_INPUT = '.cngx-combobox__input';
const ACTION_MULTI_INPUT = '.cngx-action-multi-select__input';
const INPUTS = [COMBOBOX_INPUT, ACTION_MULTI_INPUT];

const INNER_TOKENS: readonly InnerToken[] = [
  {
    token: '--cngx-select-shell-label-gap',
    value: '7px',
    property: 'columnGap',
    sites: ['.cngx-select-shell__label'],
    reaches: ['.cngx-select-shell__label'],
  },
  {
    token: '--cngx-combobox-input-min-width',
    value: '70px',
    property: 'minWidth',
    sites: INPUTS,
    reaches: INPUTS,
  },
  {
    token: '--cngx-action-multi-select-input-min-width',
    value: '70px',
    property: 'minWidth',
    sites: INPUTS,
    reaches: [ACTION_MULTI_INPUT],
  },
  {
    token: '--cngx-combobox-input-flex-basis',
    value: '70px',
    property: 'flexBasis',
    sites: INPUTS,
    reaches: INPUTS,
  },
  {
    token: '--cngx-action-multi-select-input-flex-basis',
    value: '70px',
    property: 'flexBasis',
    sites: INPUTS,
    reaches: [ACTION_MULTI_INPUT],
  },
  {
    token: '--cngx-tree-select-clear-size',
    value: '30px',
    property: 'inlineSize',
    sites: ['.cngx-tree-select__clear-all'],
    reaches: ['.cngx-tree-select__clear-all'],
  },
];

const SET_COLOR = 'rgb(1, 2, 3)';

interface TokenChain {
  /** Computed style property painted on the trigger row. */
  readonly property:
    | 'backgroundColor'
    | 'color'
    | 'borderTopColor'
    | 'outlineColor'
    | 'minHeight'
    | 'borderTopLeftRadius'
    | 'inlineSize'
    | 'columnGap'
    | 'paddingTop';
  /** The row only paints `property` while its combobox has focus. */
  readonly focus?: boolean;
  /** Read `property` off the host's `::before` floor box, not the row. */
  readonly floor?: boolean;
  /** Hosts the family token reaches; all nine when omitted. */
  readonly familyHosts?: readonly string[];
  /** Value the tokens are set to; it paints `expected` on `property`. */
  readonly value: string;
  /** Computed value `value` paints on `property`; `SET_COLOR` when omitted. */
  readonly expected?: string;
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
  {
    property: 'minHeight',
    value: '51px',
    expected: '51px',
    family: '--cngx-select-min-height',
    variants: [
      ['--cngx-multi-select-min-height', ['cngx-multi-select', 'cngx-reorderable-multi-select']],
      ['--cngx-combobox-min-height', ['cngx-combobox', 'cngx-action-multi-select']],
      ['--cngx-typeahead-min-height', ['cngx-typeahead']],
      ['--cngx-tree-select-trigger-height', ['cngx-tree-select']],
      ['--cngx-reorderable-multi-select-min-height', ['cngx-reorderable-multi-select']],
      ['--cngx-action-select-min-height', ['cngx-action-select']],
      ['--cngx-action-multi-select-min-height', ['cngx-action-multi-select']],
      ['--cngx-select-shell-min-height', ['cngx-select-shell']],
    ],
  },
  {
    property: 'borderTopLeftRadius',
    value: '7px',
    expected: '7px',
    family: '--cngx-select-radius',
    variants: [
      ['--cngx-multi-select-radius', ['cngx-multi-select', 'cngx-reorderable-multi-select']],
      ['--cngx-combobox-radius', ['cngx-combobox', 'cngx-action-multi-select']],
      ['--cngx-typeahead-radius', ['cngx-typeahead']],
      ['--cngx-tree-select-trigger-radius', ['cngx-tree-select']],
      ['--cngx-reorderable-multi-select-radius', ['cngx-reorderable-multi-select']],
      ['--cngx-action-select-radius', ['cngx-action-select']],
      ['--cngx-action-multi-select-radius', ['cngx-action-multi-select']],
      ['--cngx-select-shell-radius', ['cngx-select-shell']],
    ],
  },
  {
    // Typeahead and action select fill their container and carry no floor.
    property: 'inlineSize',
    floor: true,
    value: '170px',
    expected: '170px',
    family: '--cngx-select-min-width',
    familyHosts: [
      'cngx-select',
      'cngx-multi-select',
      'cngx-combobox',
      'cngx-tree-select',
      'cngx-reorderable-multi-select',
      'cngx-action-multi-select',
      'cngx-select-shell',
    ],
    variants: [
      ['--cngx-multi-select-min-width', ['cngx-multi-select', 'cngx-reorderable-multi-select']],
      ['--cngx-combobox-min-width', ['cngx-combobox', 'cngx-action-multi-select']],
      ['--cngx-tree-select-min-width', ['cngx-tree-select']],
      ['--cngx-reorderable-multi-select-min-width', ['cngx-reorderable-multi-select']],
      ['--cngx-action-multi-select-min-width', ['cngx-action-multi-select']],
      ['--cngx-select-shell-min-width', ['cngx-select-shell']],
    ],
  },
  {
    property: 'columnGap',
    value: '7px',
    expected: '7px',
    family: '--cngx-select-gap',
    variants: [
      ['--cngx-multi-select-gap', ['cngx-multi-select', 'cngx-reorderable-multi-select']],
      ['--cngx-combobox-gap', ['cngx-combobox', 'cngx-action-multi-select']],
      ['--cngx-typeahead-gap', ['cngx-typeahead']],
      ['--cngx-tree-select-trigger-gap', ['cngx-tree-select']],
      ['--cngx-reorderable-multi-select-gap', ['cngx-reorderable-multi-select']],
      ['--cngx-action-select-gap', ['cngx-action-select']],
      ['--cngx-action-multi-select-gap', ['cngx-action-multi-select']],
      ['--cngx-select-shell-gap', ['cngx-select-shell']],
    ],
  },
  {
    property: 'paddingTop',
    value: '7px 9px',
    expected: '7px',
    family: '--cngx-select-padding',
    variants: [
      ['--cngx-multi-select-padding', ['cngx-multi-select', 'cngx-reorderable-multi-select']],
      ['--cngx-combobox-padding', ['cngx-combobox', 'cngx-action-multi-select']],
      ['--cngx-typeahead-padding', ['cngx-typeahead']],
      ['--cngx-tree-select-trigger-padding', ['cngx-tree-select']],
      ['--cngx-reorderable-multi-select-padding', ['cngx-reorderable-multi-select']],
      ['--cngx-action-select-padding', ['cngx-action-select']],
      ['--cngx-action-multi-select-padding', ['cngx-action-multi-select']],
      ['--cngx-select-shell-padding', ['cngx-select-shell']],
    ],
  },
];

let mountedRoot: HTMLElement | null = null;

function hostOf(row: HTMLElement): HTMLElement | null {
  let el: HTMLElement | null = row.parentElement;
  while (el && !el.tagName.startsWith('CNGX-')) {
    el = el.parentElement;
  }
  return el;
}

function hostTag(row: HTMLElement): string | undefined {
  return hostOf(row)?.tagName.toLowerCase();
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
  chain: Pick<TokenChain, 'focus' | 'floor'> & {
    readonly property: TokenChain['property'] | 'outlineOffset';
  },
): string[] {
  return rows.map((row) => {
    if (chain.floor) {
      return getComputedStyle(hostOf(row)!, '::before')[chain.property];
    }
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

  it('--cngx-select-focus-offset set on an ancestor moves every focus ring', () => {
    const rows = mountRows();
    setOnAncestor('--cngx-select-focus-offset', '5px');
    paints(rows, { property: 'outlineOffset', focus: true }).forEach((offset, i) => {
      expect(offset, `${hostTag(rows[i])} trigger row`).toBe('5px');
    });
  });

  for (const chain of CHAINS) {
    const { value, family, variants } = chain;
    const set = chain.expected ?? SET_COLOR;
    it(`${family} set on an ancestor reaches every trigger row`, () => {
      const rows = mountRows();
      const before = paints(rows, chain);
      setOnAncestor(family, value);
      paints(rows, chain).forEach((painted, i) => {
        const host = hostTag(rows[i]) ?? '';
        const reached = chain.familyHosts?.includes(host) ?? true;
        expect(painted, `${host} trigger row`).toBe(reached ? set : before[i]);
      });
    });

    for (const [token, painted] of variants) {
      it(`${token} set on an ancestor repaints only ${painted.join(' + ')}`, () => {
        const rows = mountRows();
        const before = paints(rows, chain);
        setOnAncestor(token, value);
        paints(rows, chain).forEach((after, i) => {
          const host = hostTag(rows[i]) ?? '';
          const expected = painted.includes(host) ? set : before[i];
          expect(after, `${host} trigger row`).toBe(expected);
        });
      });
    }
  }
});

describe('select inner layout tokens', () => {
  for (const { token, value, property, sites, reaches } of INNER_TOKENS) {
    it(`${token} set on an ancestor reaches only ${reaches.join(' + ')}`, () => {
      const fixture = TestBed.createComponent(InnerTokensHost);
      mountedRoot = fixture.nativeElement as HTMLElement;
      document.body.appendChild(mountedRoot);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();
      const read = (): string[] =>
        sites.map((sel) => {
          const el = mountedRoot!.querySelector<HTMLElement>(sel);
          expect(el, sel).not.toBeNull();
          return getComputedStyle(el!)[property];
        });
      const before = read();
      mountedRoot.querySelector<HTMLElement>('div')!.style.setProperty(token, value);
      read().forEach((after, i) => {
        expect(after, sites[i]).toBe(reaches.includes(sites[i]) ? value : before[i]);
      });
    });
  }
});
