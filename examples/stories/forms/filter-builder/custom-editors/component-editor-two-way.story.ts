import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFilterBuilder: a component editor with a two-way value',
  subtitle:
    'A registered <code>CngxFilterEditorComponent</code> is a real citizen of the row: the row projects <code>value</code> / <code>fieldDef</code> / <code>expression</code> / <code>disabled</code> onto the mounted instance and reads <code>value.set(...)</code> straight back into the filter tree.',
  description:
    'The Rating field maps to a star editor through a component-scoped <code>CNGX_FILTER_EDITORS</code> map - no slot template, the editor type alone picks the component. Click a star and the JSON readout updates immediately (editor to tree); the seeded expression arrives pre-filled at three stars (tree to editor). The editor component lives next to this story as <code>_rating-editor.component.ts</code>.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['composition', 'integration'],
  framework: 'signal-forms',
  apiComponents: ['CngxFilterBuilder'],
  viewProviders: ['{ provide: CNGX_FILTER_EDITORS, useValue: DEMO_RATING_EDITORS }'],
  moduleImports: [
    "import { CNGX_FILTER_EDITORS, CngxFilterBuilder, createFilterExpression, createFilterGroup, type FilterFieldDef, type FilterGroup } from '@cngx/forms/filter-builder';",
    "import { DEMO_RATING_EDITORS } from './_rating-editor.component';",
  ],
  imports: ['CngxFilterBuilder'],
  setup: `protected readonly fields: readonly FilterFieldDef[] = [
    { key: 'rating', label: 'Rating', editorType: 'rating', operators: ['gte', 'eq', 'lte'] },
    { key: 'name', label: 'Name', editorType: 'string' },
  ];
  protected readonly tree = signal<FilterGroup>(
    createFilterGroup('and', [createFilterExpression('rating', 'gte', 3)]),
  );
  protected readonly jsonOut = computed(() => JSON.stringify(this.tree(), null, 2));`,
  template: `  <cngx-filter-builder [fields]="fields" [(value)]="tree" />`,
  templateChrome: `  <p class="status-row">
    <span class="status-badge">Click a star - the tree value follows.</span>
  </p>
  <pre class="code-block">{{ jsonOut() }}</pre>`,
};
