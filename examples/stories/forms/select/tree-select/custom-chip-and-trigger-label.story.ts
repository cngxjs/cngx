import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreeSelect: custom chip and trigger label',
  subtitle:
    'Two ways to restyle the trigger: <code>*cngxTreeSelectChip</code> replaces each chip and keeps the strip, <code>*cngxTreeSelectTriggerLabel</code> replaces the whole strip with a summary. Pick a mode with the radios; "Default chips" shows the built-in <code>&lt;cngx-chip&gt;</code> strip.',
  description:
    "The chip template receives <code>{ $implicit: option, option, remove }</code>, where <code>option</code> is <code>{ value, label }</code> and <code>remove()</code> is the same commit-aware removal the built-in chip uses: a chip that summarizes a fully selected subtree (<code>chipDisplay</code> <code>'parents'</code>, the default with <code>[cascadeChildren]</code>) deselects that subtree, any other chip its one value. The custom remove button stops click propagation so it does not also open the panel, and carries its own accessible name. The trigger-label template receives <code>{ $implicit: selected, selected, values, count }</code>. The two slots are alternatives: when both are projected the trigger label wins, and neither renders while the selection is empty (the placeholder shows instead).",
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  framework: 'template-only',
  apiComponents: ['CngxTreeSelect', 'CngxTreeSelectChip', 'CngxTreeSelectTriggerLabel'],
  moduleImports: [
    "import { CngxTreeSelect, CngxTreeSelectChip, CngxTreeSelectTriggerLabel } from '@cngx/forms/select';",
    "import type { CngxTreeNode } from '@cngx/utils';",
  ],
  imports: ['CngxTreeSelect', 'CngxTreeSelectChip', 'CngxTreeSelectTriggerLabel'],
  setup: `protected readonly nodes: CngxTreeNode<string>[] = [
    {
      value: 'europe',
      label: 'Europe',
      children: [
        { value: 'berlin', label: 'Berlin' },
        { value: 'lisbon', label: 'Lisbon' },
        { value: 'vienna', label: 'Vienna' },
      ],
    },
    {
      value: 'asia',
      label: 'Asia',
      children: [
        { value: 'osaka', label: 'Osaka' },
        { value: 'seoul', label: 'Seoul' },
      ],
    },
  ];
  protected readonly values = signal<string[]>(['berlin', 'lisbon', 'seoul']);
  protected readonly nodeId = (value: string) => value;
  protected readonly slotMode = signal<'default' | 'chip' | 'label'>('chip');`,
  template: `  <cngx-tree-select
    [label]="'Offices'"
    [nodes]="nodes"
    [(values)]="values"
    [nodeIdFn]="nodeId"
    [cascadeChildren]="true"
    [initiallyExpanded]="'all'"
    placeholder="Pick offices"
  >
    @if (slotMode() === 'chip') {
      <ng-template cngxTreeSelectChip let-option let-remove="remove">
        <span class="demo-tree-chip">
          <span>{{ option.label }}</span>
          <button
            type="button"
            class="demo-tree-chip__remove"
            [attr.aria-label]="'Remove ' + option.label"
            (click)="remove(); $event.stopPropagation()"
          >
            ✕
          </button>
        </span>
      </ng-template>
    }
    @if (slotMode() === 'label') {
      <ng-template cngxTreeSelectTriggerLabel let-selected let-count="count">
        <span class="demo-tree-summary">
          @if (count === 1) {
            {{ selected[0].label }}
          } @else {
            {{ selected[0].label }} and {{ count - 1 }} more
          }
        </span>
      </ng-template>
    }
  </cngx-tree-select>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <label>
      <input type="radio" name="tree-slot-mode" value="default"
        [checked]="slotMode() === 'default'" (change)="slotMode.set('default')" />
      Default chips
    </label>
    <label>
      <input type="radio" name="tree-slot-mode" value="chip"
        [checked]="slotMode() === 'chip'" (change)="slotMode.set('chip')" />
      Custom chip
    </label>
    <label>
      <input type="radio" name="tree-slot-mode" value="label"
        [checked]="slotMode() === 'label'" (change)="slotMode.set('label')" />
      Custom trigger label
    </label>
  </div>
  <div class="event-grid" style="margin-top:8px">
    <div class="event-row">
      <span class="event-label">values</span>
      <span class="event-value">{{ values().join(', ') || 'none' }}</span>
    </div>
  </div>`,
};
