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
// The same harness locks the trigger background chain. With no token set,
// every row paints transparent. `--cngx-select-bg` set on an ancestor reaches
// all nine rows. A variant token set on an ancestor repaints only the rows
// that read it: its own variant, plus the variant that chains through it
// (action-multi-select through `--cngx-combobox-bg`, reorderable-multi-select
// through `--cngx-multi-select-bg`). Tree-select's variant token is
// `--cngx-tree-select-trigger-bg`.

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

// Each variant token and the hosts whose trigger row reads it.
const VARIANT_TOKENS: readonly (readonly [string, readonly string[]])[] = [
  ['--cngx-multi-select-bg', ['cngx-multi-select', 'cngx-reorderable-multi-select']],
  ['--cngx-combobox-bg', ['cngx-combobox', 'cngx-action-multi-select']],
  ['--cngx-typeahead-bg', ['cngx-typeahead']],
  ['--cngx-tree-select-trigger-bg', ['cngx-tree-select']],
  ['--cngx-reorderable-multi-select-bg', ['cngx-reorderable-multi-select']],
  ['--cngx-action-select-bg', ['cngx-action-select']],
  ['--cngx-action-multi-select-bg', ['cngx-action-multi-select']],
  ['--cngx-select-shell-bg', ['cngx-select-shell']],
];

let mountedRoot: HTMLElement | null = null;

function hostTag(row: HTMLElement): string | undefined {
  let el: HTMLElement | null = row.parentElement;
  while (el && !el.tagName.startsWith('CNGX-')) {
    el = el.parentElement;
  }
  return el?.tagName.toLowerCase();
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('select touch floor geometry', () => {
  it('every empty trigger row sits at the 44px floor, the input variants included', () => {
    const fixture = TestBed.createComponent(TouchFloorHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const rows = Array.from(mountedRoot.querySelectorAll<HTMLElement>('.cngx-field-trigger')).map(
      (row) => ({
        host: hostTag(row),
        height: Math.round(row.getBoundingClientRect().height),
      }),
    );

    expect(rows).toHaveLength(9);
    for (const row of rows) {
      expect(row, `${row.host} trigger row`).toEqual({ host: row.host, height: 44 });
    }
  });

  it('every empty trigger row paints the same family background', () => {
    const fixture = TestBed.createComponent(TouchFloorHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const rows = Array.from(mountedRoot.querySelectorAll<HTMLElement>('.cngx-field-trigger'));
    expect(rows).toHaveLength(9);
    for (const row of rows) {
      expect(getComputedStyle(row).backgroundColor, `${hostTag(row)} trigger row`).toBe(
        'rgba(0, 0, 0, 0)',
      );
    }
  });

  it('--cngx-select-bg set on an ancestor reaches every trigger row', () => {
    const fixture = TestBed.createComponent(TouchFloorHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    mountedRoot
      .querySelector<HTMLElement>('[data-touch]')!
      .style.setProperty('--cngx-select-bg', SET_COLOR);

    const rows = Array.from(mountedRoot.querySelectorAll<HTMLElement>('.cngx-field-trigger'));
    expect(rows).toHaveLength(9);
    for (const row of rows) {
      expect(getComputedStyle(row).backgroundColor, `${hostTag(row)} trigger row`).toBe(SET_COLOR);
    }
  });

  it('--cngx-select-focus-offset set on an ancestor reaches every trigger row', () => {
    const fixture = TestBed.createComponent(TouchFloorHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    mountedRoot
      .querySelector<HTMLElement>('[data-touch]')!
      .style.setProperty('--cngx-select-focus-offset', '5px');

    const rows = Array.from(mountedRoot.querySelectorAll<HTMLElement>('.cngx-field-trigger'));
    expect(rows).toHaveLength(9);
    for (const row of rows) {
      expect(
        getComputedStyle(row).getPropertyValue('--cngx-select-focus-offset').trim(),
        `${hostTag(row)} trigger row`,
      ).toBe('5px');
    }
  });

  for (const [token, painted] of VARIANT_TOKENS) {
    it(`${token} set on an ancestor repaints only ${painted.join(' + ')}`, () => {
      const fixture = TestBed.createComponent(TouchFloorHost);
      mountedRoot = fixture.nativeElement as HTMLElement;
      document.body.appendChild(mountedRoot);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();

      mountedRoot.querySelector<HTMLElement>('[data-touch]')!.style.setProperty(token, SET_COLOR);

      const rows = Array.from(mountedRoot.querySelectorAll<HTMLElement>('.cngx-field-trigger'));
      expect(rows).toHaveLength(9);
      for (const row of rows) {
        const host = hostTag(row) ?? '';
        const expected = painted.includes(host) ? SET_COLOR : 'rgba(0, 0, 0, 0)';
        expect(getComputedStyle(row).backgroundColor, `${host} trigger row`).toBe(expected);
      }
    });
  }
});
