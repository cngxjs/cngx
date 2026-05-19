import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Default (no icon projected)',
  subtitle: 'When no <code>[cngxEmptyStateIcon]</code> is projected, a built-in inbox SVG is shown.',
  description: 'Universal empty-state atom for grids, tables, lists, and dashboards. Communicates why a view is empty and what the user can do next. Shows a default icon when none is projected.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: [
    'CngxEmptyState',
  ],
  moduleImports: [
    'import { CngxEmptyState } from \'@cngx/ui/empty-state\';',
  ],
  imports: ['CngxEmptyState'],
  template: `
  <div style="border:1px solid var(--cngx-color-border);border-radius:8px;overflow:hidden">
    <cngx-empty-state
      title="No items yet"
      description="Create your first item to get started." />
  </div>`,
};
