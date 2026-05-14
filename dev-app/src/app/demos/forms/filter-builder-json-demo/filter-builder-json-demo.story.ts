import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Filter Builder — JSON form component',
  navLabel: 'Filter Builder JSON',
  navCategory: 'filter-builder',
  description:
    '<cngx-filter-builder> driven as a pure form component: the consumer reads the tree as JSON, ' +
    'ships it to a backend, or stores it as a preset. No table, no predicate evaluation — the ' +
    'builder is the sole UI for assembling a serialisable FilterGroup.',
  apiComponents: ['CngxFilterBuilder'],
  overview:
    '<p>Use this shape when the builder is the form, not a UI in front of a list. The two-way bound ' +
    '<code>FilterGroup</code> is the value the consumer cares about — typical sinks: HTTP request body, ' +
    'IndexedDB persisted preset, URL query string. No <code>toFilterPredicate</code> wiring, no <code>CngxFilter</code> ' +
    'bridge.</p>' +
    '<p>The JSON panel shows the live tree; the actions row demonstrates programmatic resets ' +
    '(<code>createEmptyFilterRoot()</code>) and seeding from a pre-built preset. Every value mutation ' +
    'flows through the same model-signal so the panel and any side effect stays in lock-step.</p>',
  moduleImports: [
    "import { CngxFilterBuilder, createEmptyFilterRoot, createFilterExpression, createFilterGroup, type FilterFieldDef, type FilterGroup } from '@cngx/forms/filter-builder';",
  ],
  setup: `
  protected readonly fields: readonly FilterFieldDef[] = [
    { key: 'name', label: 'Name', editorType: 'string' },
    { key: 'age', label: 'Age', editorType: 'number' },
    { key: 'active', label: 'Active', editorType: 'boolean' },
    { key: 'role', label: 'Role', editorType: 'string' },
  ];
  protected readonly tree = signal<FilterGroup>(createEmptyFilterRoot());
  protected readonly jsonOut = computed(() => JSON.stringify(this.tree(), null, 2));
  protected readonly nodeCount = computed(() => this.countNodes(this.tree()));

  private countNodes(group: FilterGroup): number {
    let n = 1;
    for (const child of group.filters) {
      n += child.type === 'group' ? this.countNodes(child) : 1;
    }
    return n;
  }

  protected resetTree(): void {
    this.tree.set(createEmptyFilterRoot());
  }

  protected seedExamplePreset(): void {
    this.tree.set(
      createFilterGroup('and', [
        createFilterExpression('role', 'eq', 'Engineer'),
        createFilterGroup('or', [
          createFilterExpression('age', 'gte', 30),
          createFilterExpression('active', 'eq', true),
        ]),
      ]),
    );
  }
  `,
  sections: [
    {
      title: 'Builder ↔ JSON',
      subtitle:
        'Build a tree on the left; copy the JSON on the right. No table, no predicate — the FilterGroup IS the form value.',
      template: `
  <div class="json-demo">
    <div class="json-demo__builder">
      <cngx-filter-builder [fields]="fields" [(value)]="tree" />
      <div class="json-demo__actions">
        <button type="button" (click)="resetTree()">Reset</button>
        <button type="button" (click)="seedExamplePreset()">Seed preset</button>
      </div>
    </div>
    <div class="json-demo__output">
      <div class="json-demo__status">
        <span class="status-badge">Nodes: {{ nodeCount() }}</span>
      </div>
      <pre class="code-block">{{ jsonOut() }}</pre>
    </div>
  </div>
      `,
      imports: ['CngxFilterBuilder'],
      css: `
.json-demo { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; align-items: start; }
@media (max-width: 720px) { .json-demo { grid-template-columns: 1fr; } }
.json-demo__builder { display: flex; flex-direction: column; gap: 12px; }
.json-demo__actions { display: flex; gap: 8px; }
.json-demo__actions button { padding: 4px 12px; }
.json-demo__output { display: flex; flex-direction: column; gap: 8px; }
.json-demo__status { display: flex; gap: 8px; }
      `,
    },
  ],
};
