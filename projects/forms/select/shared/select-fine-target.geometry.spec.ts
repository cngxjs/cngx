import {
  Component,
  signal,
  ViewEncapsulation,
  type Type,
  type WritableSignal,
} from '@angular/core';
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

// Runs in a real Chromium (the `test-geometry` target). On a fine pointer
// (`data-touch="off"`, the 0px touch floor) every clear button is a hit area of
// at least 24x24 (WCAG 2.5.8): the box floors to
// `--cngx-select-clear-target-min` while the glyph keeps its size. The trigger
// row keeps its height at every density, with the cngx default skin and with
// the Material bridge. The chip remove buttons in the same strips are held to
// the same 24px floor. The coarse-pointer half (44px) lives in
// `select-touch-floor.geometry.spec.ts`.

const TEMPLATE = `
  <div data-touch="off" [attr.data-density]="density()" style="display: block; width: 20rem; margin: 1rem">
      <div class="with-clear">
        <cngx-select [label]="'C'" [options]="options" [clearable]="true" [value]="'red'" />
        <cngx-multi-select
          [label]="'C'"
          [options]="options"
          [clearable]="true"
          [values]="['red']"
        />
        <cngx-combobox [label]="'C'" [options]="options" [clearable]="true" [values]="['red']" />
        <cngx-typeahead [label]="'C'" [options]="options" [clearable]="true" [value]="'red'" />
        <cngx-tree-select
          [label]="'C'"
          [nodes]="options"
          [nodeIdFn]="nodeId"
          [clearable]="true"
          [values]="['red']"
        />
        <cngx-reorderable-multi-select
          [label]="'C'"
          [options]="options"
          [clearable]="true"
          [values]="['red']"
        />
        <cngx-action-select [label]="'C'" [options]="options" [clearable]="true" [value]="'red'" />
        <cngx-action-multi-select
          [label]="'C'"
          [options]="options"
          [clearable]="true"
          [values]="['red']"
        />
        <cngx-select-shell [label]="'C'" [clearable]="true" [value]="'red'">
          <cngx-option [value]="'red'">Red</cngx-option>
        </cngx-select-shell>
      </div>
      <div class="without-clear">
        <cngx-select [label]="'C'" [options]="options" [clearable]="false" [value]="'red'" />
        <cngx-multi-select
          [label]="'C'"
          [options]="options"
          [clearable]="false"
          [values]="['red']"
        />
        <cngx-combobox [label]="'C'" [options]="options" [clearable]="false" [values]="['red']" />
        <cngx-typeahead [label]="'C'" [options]="options" [clearable]="false" [value]="'red'" />
        <cngx-tree-select
          [label]="'C'"
          [nodes]="options"
          [nodeIdFn]="nodeId"
          [clearable]="false"
          [values]="['red']"
        />
        <cngx-reorderable-multi-select
          [label]="'C'"
          [options]="options"
          [clearable]="false"
          [values]="['red']"
        />
        <cngx-action-select [label]="'C'" [options]="options" [clearable]="false" [value]="'red'" />
        <cngx-action-multi-select
          [label]="'C'"
          [options]="options"
          [clearable]="false"
          [values]="['red']"
        />
        <cngx-select-shell [label]="'C'" [clearable]="false" [value]="'red'">
          <cngx-option [value]="'red'">Red</cngx-option>
        </cngx-select-shell>
      </div>
  </div>
`;

const IMPORTS = [
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

const STYLES = [
  '../../../core/theming/layers.css',
  '../../../core/theming/system-tokens.css',
  '../../../core/theming/density-tokens.css',
  '../../../core/theming/reset.css',
  '../../../core/theming/base.css',
  '../../theming/components/cngx-field-affix.css',
  '../../theming/components/cngx-field-skin.css',
  './select-base.css',
];

type Density = 'comfortable' | 'compact';
type HostType = Type<{ density: WritableSignal<Density> }>;

@Component({
  selector: 'cngx-select-fine-target-host',
  standalone: true,
  imports: IMPORTS,
  styleUrls: STYLES,
  encapsulation: ViewEncapsulation.None,
  template: TEMPLATE,
})
class FineTargetHost {
  readonly density = signal<Density>('comfortable');
  readonly options = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
  ];
  readonly nodeId = (value: unknown): string => String(value);
}

@Component({
  selector: 'cngx-select-fine-target-bridge-host',
  standalone: true,
  imports: IMPORTS,
  styleUrls: [...STYLES, './select-bridge-states.spec-host.scss'],
  encapsulation: ViewEncapsulation.None,
  template: TEMPLATE,
})
class FineTargetBridgeHost {
  readonly density = signal<Density>('comfortable');
  readonly options = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
  ];
  readonly nodeId = (value: unknown): string => String(value);
}

const CLEAR_BUTTONS: Readonly<Record<string, string>> = {
  'cngx-select': '.cngx-select__clear',
  'cngx-multi-select': '.cngx-multi-select__clear-all',
  'cngx-combobox': '.cngx-combobox__clear-all',
  'cngx-typeahead': '.cngx-typeahead__clear',
  'cngx-tree-select': '.cngx-tree-select__clear-all',
  'cngx-reorderable-multi-select': '.cngx-reorderable-multi-select__clear-all',
  'cngx-action-select': '.cngx-action-select__clear',
  'cngx-action-multi-select': '.cngx-action-multi-select__clear-all',
  'cngx-select-shell': '.cngx-select-shell__clear',
};

let mountedRoot: HTMLElement | null = null;

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

function mount(host: HostType, density: Density): HTMLElement {
  const fixture = TestBed.createComponent(host);
  fixture.componentInstance.density.set(density);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  return mountedRoot;
}

function rowHeights(group: HTMLElement): Record<string, number> {
  return Object.fromEntries(
    Object.keys(CLEAR_BUTTONS).map((host) => [
      host,
      Math.round(
        group.querySelector(`${host} .cngx-field-trigger`)!.getBoundingClientRect().height,
      ),
    ]),
  );
}

function expectHitArea(button: HTMLElement, label: string): void {
  const rect = button.getBoundingClientRect();
  expect(Math.round(rect.width), `${label} width`).toBeGreaterThanOrEqual(24);
  expect(Math.round(rect.height), `${label} height`).toBeGreaterThanOrEqual(24);
  // The whole box takes the click: probe 1px inside each edge midpoint.
  const midX = rect.left + rect.width / 2;
  const midY = rect.top + rect.height / 2;
  for (const [x, y] of [
    [midX, rect.top + 1],
    [midX, rect.bottom - 1],
    [rect.left + 1, midY],
    [rect.right - 1, midY],
  ]) {
    const hit = document.elementFromPoint(x, y);
    expect(hit !== null && button.contains(hit), `${label} at ${x},${y}`).toBe(true);
  }
}

const CASES: ReadonlyArray<readonly [string, HostType, Density]> = [
  ['default skin', FineTargetHost, 'comfortable'],
  ['default skin', FineTargetHost, 'compact'],
  ['Material bridge', FineTargetBridgeHost, 'comfortable'],
  ['Material bridge', FineTargetBridgeHost, 'compact'],
];

describe('select clear button fine-pointer hit area', () => {
  describe.each(CASES)('%s, %s', (_skin, host, density) => {
    it('every clear button is a >= 24x24 hit area', () => {
      const group = mount(host, density).querySelector<HTMLElement>('.with-clear')!;
      for (const [tag, selector] of Object.entries(CLEAR_BUTTONS)) {
        const button = group.querySelector<HTMLElement>(`${tag} ${selector}`);
        expect(button, tag).not.toBeNull();
        expectHitArea(button!, tag);
      }
    });

    it('the clear button leaves every trigger row at its height without one', () => {
      const root = mount(host, density);
      expect(rowHeights(root.querySelector<HTMLElement>('.with-clear')!)).toEqual(
        rowHeights(root.querySelector<HTMLElement>('.without-clear')!),
      );
    });

    it('every in-trigger chip remove button is a >= 24x24 hit area', () => {
      const removes = Array.from(
        mount(host, density).querySelectorAll<HTMLElement>('.with-clear .cngx-chip__remove'),
      );
      expect(removes.length).toBeGreaterThan(0);
      for (const remove of removes) {
        expectHitArea(remove, remove.closest('.cngx-field-trigger')?.parentElement?.tagName ?? '');
      }
    });
  });

  it('--cngx-select-clear-target-min set on an ancestor resizes every clear button', () => {
    const root = mount(FineTargetHost, 'comfortable');
    root
      .querySelector<HTMLElement>('[data-touch]')!
      .style.setProperty('--cngx-select-clear-target-min', '30px');
    for (const [tag, selector] of Object.entries(CLEAR_BUTTONS)) {
      const rect = root
        .querySelector<HTMLElement>(`.with-clear ${tag} ${selector}`)!
        .getBoundingClientRect();
      expect([Math.round(rect.width) >= 30, Math.round(rect.height)], tag).toEqual([true, 30]);
    }
  });
});
