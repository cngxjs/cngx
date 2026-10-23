import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Select family: summary trigger under the touch floor',
  subtitle:
    'Under the touch floor the five multi-value selects swap their chip strip for a one-line summary: the placeholder with nothing selected, the label with one value, the first label plus a <code>+N</code> badge with more. The row keeps the 44px height at every count; editing happens in the panel or sheet.',
  description:
    'The touch floor is <code>--cngx-target-min</code> above 0: <code>(any-pointer: coarse)</code>, <code>[cngxTouchTarget]="\'on\'"</code> or <code>data-touch="on"</code> on the select or an ancestor. <code>[cngxTouchTarget]="\'off\'"</code> (or <code>data-touch="off"</code>) brings the chips back. A screen reader hears the whole selection, not just the first label: the div-combobox variants carry it in the trigger, the input variants (<code>CngxCombobox</code>, <code>CngxActionMultiSelect</code>) put the summary in front of the input and describe the input with it. <code>chipOverflow</code>, <code>maxVisibleChips</code> and the per-chip slots apply on a fine pointer only; <code>*cngxSelectChipOverflow</code> also replaces the summary badge. The reorderable select moves its sorting into a list above the options (see the reorder-in-panel story). Pick <strong>on</strong> to see the summary with a mouse, <strong>off</strong> to see the chips on a phone.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: [
    'CngxMultiSelect',
    'CngxCombobox',
    'CngxTreeSelect',
    'CngxReorderableMultiSelect',
    'CngxActionMultiSelect',
    'CngxTouchTarget',
  ],
  moduleImports: [
    "import { CngxTouchTarget } from '@cngx/core';",
    "import { CngxActionMultiSelect, CngxCombobox, CngxMultiSelect, CngxReorderableMultiSelect, CngxTreeSelect, type CngxSelectOptionDef } from '@cngx/forms/select';",
    "import type { CngxTreeNode } from '@cngx/utils';",
  ],
  imports: [
    'CngxTouchTarget',
    'CngxMultiSelect',
    'CngxCombobox',
    'CngxTreeSelect',
    'CngxReorderableMultiSelect',
    'CngxActionMultiSelect',
  ],
  setup: `protected readonly cities: CngxSelectOptionDef<string>[] = [
    'Amsterdam', 'Athens', 'Berlin', 'Lisbon', 'Oslo', 'Paris', 'Rome', 'Vienna',
  ].map((name) => ({ value: name, label: name }));
  protected readonly regions: CngxTreeNode<string>[] = [
    { value: 'North', label: 'North', children: [{ value: 'Oslo', label: 'Oslo' }, { value: 'Helsinki', label: 'Helsinki' }] },
    { value: 'South', label: 'South', children: [{ value: 'Athens', label: 'Athens' }, { value: 'Rome', label: 'Rome' }] },
  ];
  protected readonly nodeId = (value: string): string => value;
  protected readonly touch = signal<'auto' | 'on' | 'off'>('on');
  protected readonly multi = signal<string[]>(['Berlin', 'Lisbon', 'Oslo']);
  protected readonly combo = signal<string[]>(['Paris']);
  protected readonly region = signal<string[]>(['North', 'Oslo', 'Helsinki', 'Rome']);
  protected readonly route = signal<string[]>(['Vienna', 'Berlin', 'Amsterdam']);
  protected readonly actionMulti = signal<string[]>(['Rome', 'Athens']);`,
  template: `<div
    [cngxTouchTarget]="touch() === 'auto' ? undefined : touch()"
    style="display: grid; gap: 16px; max-inline-size: 24rem"
  >
    <cngx-multi-select label="Cities" [options]="cities" [(values)]="multi" placeholder="Pick cities" />
    <cngx-combobox label="Cities (combobox)" [options]="cities" [(values)]="combo" />
    <cngx-tree-select
      label="Region"
      [nodes]="regions"
      [nodeIdFn]="nodeId"
      [cascadeChildren]="true"
      [(values)]="region"
    />
    <cngx-reorderable-multi-select label="Route" [options]="cities" [(values)]="route" />
    <cngx-action-multi-select label="Cities (action)" [options]="cities" [(values)]="actionMulti" />
  </div>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <label>
      <input type="radio" name="summary-touch" value="auto"
        [checked]="touch() === 'auto'" (change)="touch.set('auto')" />
      auto (environment)
    </label>
    <label>
      <input type="radio" name="summary-touch" value="on"
        [checked]="touch() === 'on'" (change)="touch.set('on')" />
      on (summary)
    </label>
    <label>
      <input type="radio" name="summary-touch" value="off"
        [checked]="touch() === 'off'" (change)="touch.set('off')" />
      off (chips)
    </label>
  </div>`,
};
