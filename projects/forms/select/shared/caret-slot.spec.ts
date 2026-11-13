import { Component, type Type } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
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
import { CngxSelectCaret } from './template-slots';

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
];

const displayWith = (v: string): string => OPTIONS.find((o) => o.value === v)?.label ?? '';

const NODES: CngxTreeNode<string>[] = [{ value: 'a', children: [{ value: 'a1' }] }, { value: 'b' }];

const CARET = `<ng-template cngxSelectCaret><span class="cs-projected-caret">v</span></ng-template>`;

@Component({
  selector: 'cs-select',
  template: `<cngx-select [label]="'Color'" [options]="options">${CARET}</cngx-select>`,
  imports: [CngxSelect, CngxSelectCaret],
})
class SelectHost {
  readonly options = OPTIONS;
}

@Component({
  selector: 'cs-multi-select',
  template: `<cngx-multi-select [label]="'Colors'" [options]="options"
    >${CARET}</cngx-multi-select
  >`,
  imports: [CngxMultiSelect, CngxSelectCaret],
})
class MultiSelectHost {
  readonly options = OPTIONS;
}

@Component({
  selector: 'cs-reorderable',
  template: `
    <cngx-reorderable-multi-select [label]="'Colors'" [options]="options">
      ${CARET}
    </cngx-reorderable-multi-select>
  `,
  imports: [CngxReorderableMultiSelect, CngxSelectCaret],
})
class ReorderableHost {
  readonly options = OPTIONS;
}

@Component({
  selector: 'cs-combobox',
  template: `<cngx-combobox [label]="'Colors'" [options]="options">${CARET}</cngx-combobox>`,
  imports: [CngxCombobox, CngxSelectCaret],
})
class ComboboxHost {
  readonly options = OPTIONS;
}

@Component({
  selector: 'cs-typeahead',
  template: `
    <cngx-typeahead [label]="'Color'" [options]="options" [displayWith]="displayWith">
      ${CARET}
    </cngx-typeahead>
  `,
  imports: [CngxTypeahead, CngxSelectCaret],
})
class TypeaheadHost {
  readonly options = OPTIONS;
  readonly displayWith = displayWith;
}

@Component({
  selector: 'cs-action-select',
  template: `
    <cngx-action-select [label]="'Color'" [options]="options" [displayWith]="displayWith">
      ${CARET}
    </cngx-action-select>
  `,
  imports: [CngxActionSelect, CngxSelectCaret],
})
class ActionSelectHost {
  readonly options = OPTIONS;
  readonly displayWith = displayWith;
}

@Component({
  selector: 'cs-action-multi-select',
  template: `
    <cngx-action-multi-select [label]="'Colors'" [options]="options">
      ${CARET}
    </cngx-action-multi-select>
  `,
  imports: [CngxActionMultiSelect, CngxSelectCaret],
})
class ActionMultiSelectHost {
  readonly options = OPTIONS;
}

@Component({
  selector: 'cs-select-shell',
  template: `
    <cngx-select-shell [label]="'Color'">
      ${CARET}
      <cngx-option [value]="'red'">Red</cngx-option>
    </cngx-select-shell>
  `,
  imports: [CngxSelectShell, CngxSelectOption, CngxSelectCaret],
})
class SelectShellHost {}

@Component({
  selector: 'cs-tree-select',
  template: `
    <cngx-tree-select [label]="'Nodes'" [nodes]="nodes" [nodeIdFn]="idFn"
      >${CARET}</cngx-tree-select
    >
  `,
  imports: [CngxTreeSelect, CngxSelectCaret],
})
class TreeSelectHost {
  readonly nodes = NODES;
  readonly idFn = (v: string): string => v;
}

const VARIANTS: readonly { readonly name: string; readonly host: Type<unknown> }[] = [
  { name: 'CngxSelect', host: SelectHost },
  { name: 'CngxMultiSelect', host: MultiSelectHost },
  { name: 'CngxReorderableMultiSelect', host: ReorderableHost },
  { name: 'CngxCombobox', host: ComboboxHost },
  { name: 'CngxTypeahead', host: TypeaheadHost },
  { name: 'CngxActionSelect', host: ActionSelectHost },
  { name: 'CngxActionMultiSelect', host: ActionMultiSelectHost },
  { name: 'CngxSelectShell', host: SelectShellHost },
  { name: 'CngxTreeSelect', host: TreeSelectHost },
];

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  TestBed.flushEffects();
  await Promise.resolve();
  fixture.detectChanges();
}

describe.each(VARIANTS)('$name projected caret', (variant) => {
  it('renders a projected *cngxSelectCaret inside an aria-hidden wrapper', async () => {
    const fixture = TestBed.createComponent(variant.host);
    await settle(fixture);

    const caret = (fixture.nativeElement as HTMLElement).querySelector('.cs-projected-caret');
    expect(caret).not.toBeNull();
    expect(caret!.closest('[aria-hidden="true"]')).not.toBeNull();
  });
});
