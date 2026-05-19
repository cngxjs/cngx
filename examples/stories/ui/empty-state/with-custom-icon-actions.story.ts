import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'With custom icon + actions',
  subtitle: 'Project any icon via <code>[cngxEmptyStateIcon]</code>. Primary and secondary action slots.',
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
      title="No results found"
      description="Try adjusting your search or filter criteria.">
      <svg cngxEmptyStateIcon width="48" height="48" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
      <button cngxEmptyStateAction class="chip">Reset filters</button>
      <a cngxEmptyStateSecondary href="#" style="font-size:0.8125rem;color:var(--interactive,#4f46e5)">
        Learn about search syntax
      </a>
    </cngx-empty-state>
  </div>`,
};
