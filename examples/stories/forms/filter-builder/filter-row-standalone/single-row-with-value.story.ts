import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFilterRow: single row with value',
  subtitle: 'Edit field, operator, and value below. The bound signal updates on every change; clicking Remove writes <code>null</code>.',
  description: 'One standalone <cngx-filter-row> with [(value)]. No table, no builder wrapper. Shows the raw two-way binding contract so consumers can copy-paste the pattern.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxFilterRow',
  ],
  moduleImports: [
    'import { CngxFilterRow, type FilterExpression, type FilterFieldDef } from \'@cngx/forms/filter-builder\';',
  ],
  imports: ['CngxFilterRow', 'JsonPipe'],
  setup: `protected readonly fields: readonly FilterFieldDef[] = [
    { key: 'name', label: 'Name', editorType: 'string' },
    { key: 'age', label: 'Age', editorType: 'number' },
    { key: 'active', label: 'Active', editorType: 'boolean' },
  ];
  protected readonly value = signal<FilterExpression | null>(null);
  protected reset(): void {
    this.value.set(null);
  }`,
  template: `
  <cngx-filter-row [fields]="fields" [(value)]="value" />

  <div class="row-actions button-row">
    <button type="button" class="chip" (click)="reset()">Reset to null</button>
  </div>

  <pre class="code-block">{{ value() | json }}</pre>
      `,
  css: `
.row-actions { margin-top: 12px; }
.row-actions button { padding: 4px 10px; }
      `,
};
