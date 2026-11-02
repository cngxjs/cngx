import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type { CngxTreeNode } from '@cngx/utils';

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
import type { CngxSelectOptionDef } from './option.model';

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
];

const NODES: CngxTreeNode<string>[] = [{ value: 'a', children: [{ value: 'a1' }] }];

@Component({
  selector: 'pts-host',
  template: `
    <cngx-select [label]="'A'" [options]="options" />
    <cngx-multi-select [label]="'B'" [options]="options" />
    <cngx-combobox [label]="'C'" [options]="options" />
    <cngx-typeahead [label]="'D'" [options]="options" />
    <cngx-tree-select [label]="'E'" [nodes]="nodes" [nodeIdFn]="nodeIdFn" />
    <cngx-reorderable-multi-select [label]="'F'" [options]="options" />
    <cngx-action-select [label]="'G'" [options]="options" />
    <cngx-action-multi-select [label]="'H'" [options]="options" />
    <cngx-select-shell [label]="'I'">
      <cngx-option [value]="'red'">Red</cngx-option>
    </cngx-select-shell>
  `,
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
})
class AllVariantsHost {
  readonly options = OPTIONS;
  readonly nodes = NODES;
  readonly nodeIdFn = (v: string): string => v;
}

// A scrolling panel is a keyboard-focusable scroller in Chromium. Focus stays
// on the trigger while the panel is open (aria-activedescendant), so the
// panel must never take a Tab stop of its own: one Tab leaves the control.
describe('select family panel tab stop', () => {
  it('keeps every panel out of the sequential focus order', () => {
    const fixture = TestBed.createComponent(AllVariantsHost);
    fixture.detectChanges();

    const panels = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.cngx-select__panel'),
    );
    expect(panels).toHaveLength(9);
    for (const panel of panels) {
      expect(panel.getAttribute('tabindex')).toBe('-1');
      expect(panel.tabIndex).toBe(-1);
    }
  });
});
