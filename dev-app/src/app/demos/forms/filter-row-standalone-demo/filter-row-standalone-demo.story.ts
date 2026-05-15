import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Filter Row — minimal',
  navLabel: 'Filter Row (minimal)',
  navCategory: 'filter-builder',
  description:
    'One standalone <cngx-filter-row> with [(value)]. No table, no builder wrapper. ' +
    'Shows the raw two-way binding contract so consumers can copy-paste the pattern.',
  apiComponents: ['CngxFilterRow'],
  overview:
    '<p>The minimal standalone shape: pass a field list and a writable signal. The row reads / writes ' +
    'a <code>FilterExpression | null</code> directly. When the bound value is <code>null</code> the ' +
    'row renders a single field-picker as the empty state; picking a field seeds a fresh expression ' +
    'with the field default operator. The Remove button writes <code>null</code> back.</p>' +
    '<p>No <code>&lt;cngx-filter-builder&gt;</code> wrapper, no presenter, no tree — just one expression node ' +
    'in a single signal. Use this shape inside table column headers, side panels, or anywhere a full ' +
    'recursive builder is overkill.</p>',
  moduleImports: [
    "import { CngxFilterRow, type FilterExpression, type FilterFieldDef } from '@cngx/forms/filter-builder';",
  ],
  setup: `
  protected readonly fields: readonly FilterFieldDef[] = [
    { key: 'name', label: 'Name', editorType: 'string' },
    { key: 'age', label: 'Age', editorType: 'number' },
    { key: 'active', label: 'Active', editorType: 'boolean' },
  ];
  protected readonly value = signal<FilterExpression | null>(null);
  protected reset(): void {
    this.value.set(null);
  }
  `,
  sections: [
    {
      title: 'Single row with [(value)]',
      subtitle:
        'Edit field, operator, and value below. The bound signal updates on every change; clicking Remove writes <code>null</code>.',
      template: `
  <cngx-filter-row [fields]="fields" [(value)]="value" />

  <div class="row-actions">
    <button type="button" (click)="reset()">Reset to null</button>
  </div>

  <pre class="code-block">{{ value() | json }}</pre>
      `,
      imports: ['CngxFilterRow', 'JsonPipe'],
      css: `
.row-actions { margin-top: 12px; }
.row-actions button { padding: 4px 10px; }
      `,
    },
  ],
};
