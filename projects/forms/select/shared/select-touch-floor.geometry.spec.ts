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
// floor, so the inner input must not add the row padding on top of it. The
// same harness locks one trigger surface: every row resolves its background
// through `--cngx-select-bg`, transparent by default.

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

    const rows = Array.from(
      mountedRoot.querySelectorAll<HTMLElement>('.cngx-field-trigger'),
    ).map((row) => ({
      host: hostTag(row),
      height: Math.round(row.getBoundingClientRect().height),
    }));

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
});
