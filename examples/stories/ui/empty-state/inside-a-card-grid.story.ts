import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Inside a Card Grid',
  subtitle: 'Used via <code>ng-template[cngxCardGridEmpty]</code> — the grid selects the template by reason.',
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
    'import { CngxCardGrid, CngxCardGridEmpty } from \'@cngx/common/card\';',
  ],
  imports: ['CngxEmptyState', 'CngxCardGrid', 'CngxCardGridEmpty'],
  setup: `protected cardItems = signal<string[]>([]);`,
  template: `
  <cngx-card-grid [items]="cardItems()" emptyReason="first-use" minWidth="200px">
    <ng-template cngxCardGridEmpty="first-use">
      <cngx-empty-state
        title="Welcome!"
        description="Add your first card to this grid.">
        <svg cngxEmptyStateIcon width="48" height="48" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        <button cngxEmptyStateAction class="chip">Add card</button>
      </cngx-empty-state>
    </ng-template>
  </cngx-card-grid>`,
};
