import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFilterBuilder: seeded tree and or composition',
  subtitle: 'Pre-populated with two expressions joined by <code>and</code>. Add a nested group to compose <code>and / or</code> hierarchies.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['composition', 'visual-variants'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxFilterBuilder',
  ],
  moduleImports: [
    'import { CngxFilterBuilder, type FilterGroup } from \'@cngx/forms/filter-builder\';',
    'import { FILTER_BUILDER_FIELDS, FILTER_BUILDER_SEED } from \'../../../fixtures\';',
  ],
  imports: ['CngxFilterBuilder'],
  setup: `protected readonly fields = FILTER_BUILDER_FIELDS;
  protected readonly seedTree = signal<FilterGroup>(FILTER_BUILDER_SEED);
  protected formatTree(t: FilterGroup): string {
    return JSON.stringify(t, null, 2);
  }`,
  template: `
  <div class="demo-form">
    <cngx-filter-builder [fields]="fields" [(value)]="seedTree" />
    <pre class="code-block"><code>{{ formatTree(seedTree()) }}</code></pre>
  </div>
      `,
};
