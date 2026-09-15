import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreetable: Multi select checkboxes',
  subtitle:
    '<code>selectionMode="multi"</code> plus <code>[showCheckboxes]="true"</code> renders a checkbox column with a select-all checkbox in its header. Select-all is visibility-bounded: it only touches rows whose ancestors are expanded, and <code>Ctrl+A</code> / <code>Cmd+A</code> toggles the same set from the keyboard.',
  description:
    'Selection state is communicated via <code>aria-selected</code> and native checkboxes; bulk toggles announce the affected row count through a polite live region. Per-row toggles stay silent - the <code>aria-selected</code> flip is the announcement.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: ['CngxTreetable'],
  references: [
    {
      label: 'WAI-ARIA APG Treegrid Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/',
    },
  ],
  moduleImports: [
    "import { CngxTreetable } from '@cngx/data-display/treetable';",
    "import { ORG_TREE, type Employee } from '../../../../fixtures';",
  ],
  imports: ['CngxTreetable'],
  setup: `protected readonly orgTree = ORG_TREE;`,
  setupChrome: `protected handleClear(table: CngxTreetable<Employee>): void {
    table.selectedIds.set(new Set());
  }`,
  template: `  <cngx-treetable
    #tt
    [tree]="orgTree"
    selectionMode="multi"
    [showCheckboxes]="true"
  />`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="handleClear(tt)">Clear selection</button>
  </div>
<div class="event-grid" style="margin-top:8px">
    <div class="event-row">
      <span class="event-label">Rows selected</span>
      <span class="event-value">{{ tt.selectedIds().size }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">All visible selected</span>
      <span class="event-value">{{ tt.isAllSelected() ? 'yes' : 'no' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Indeterminate</span>
      <span class="event-value">{{ tt.isIndeterminate() ? 'yes' : 'no' }}</span>
    </div>
  </div>`,
};
