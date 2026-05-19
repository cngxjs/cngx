import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Inside a List',
  subtitle: 'Replaces list content when empty. Works with any container — no special wiring needed.',
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
  setup: `protected listItems = signal<string[]>([]);`,
  template: `
  <div style="border:1px solid var(--cngx-color-border);border-radius:8px;min-height:120px;display:flex;align-items:center;justify-content:center">
    @if (listItems().length === 0) {
      <cngx-empty-state
        title="All tasks completed"
        description="Nothing left to do. Enjoy your day!">
        <svg cngxEmptyStateIcon width="48" height="48" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </cngx-empty-state>
    }
  </div>`,
};
