import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Empty State',
  navLabel: 'EmptyState',
  navCategory: 'ui',
  description:
    'Universal empty-state atom for grids, tables, lists, and dashboards. Communicates why a view is empty and what the user can do next. Shows a default icon when none is projected.',
  apiComponents: ['CngxEmptyState'],
  overview:
    '<p><code>cngx-empty-state</code> uses <code>role="status"</code> + <code>aria-live="polite"</code> so screen readers announce state changes. ' +
    'The icon slot accepts any icon system — <code>mat-icon</code>, SVG, or custom. If no icon is projected, a default inbox SVG is shown.</p>' +
    '<p>Works in any container: card grids, tables, lists, dashboards, dialogs.</p>',
  moduleImports: [
    "import { CngxEmptyState } from '@cngx/ui/empty-state';",
    "import { CngxCardGrid, CngxCardGridEmpty } from '@cngx/common/card';",
  ],
  setup: `
  protected showTable = signal(true);
  protected tableItems = signal<string[]>([]);
  protected cardItems = signal<string[]>([]);
  protected listItems = signal<string[]>([]);
  `,
  sections: [
    {
      title: 'Default (no icon projected)',
      subtitle:
        'When no <code>[cngxEmptyStateIcon]</code> is projected, a built-in inbox SVG is shown.',
      imports: ['CngxEmptyState'],
      template: `
  <div style="border:1px solid var(--border-color,#e0e0e0);border-radius:8px;overflow:hidden">
    <cngx-empty-state
      title="No items yet"
      description="Create your first item to get started." />
  </div>`,
    },
    {
      title: 'With custom icon + actions',
      subtitle:
        'Project any icon via <code>[cngxEmptyStateIcon]</code>. Primary and secondary action slots.',
      imports: ['CngxEmptyState'],
      template: `
  <div style="border:1px solid var(--border-color,#e0e0e0);border-radius:8px;overflow:hidden">
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
    },
    {
      title: 'Inside a Card Grid',
      subtitle:
        'Used via <code>ng-template[cngxCardGridEmpty]</code> — the grid selects the template by reason.',
      imports: ['CngxEmptyState', 'CngxCardGrid', 'CngxCardGridEmpty'],
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
    },
    {
      title: 'Inside a Table',
      subtitle:
        'Replaces table body when no rows match. The table header stays visible for context.',
      imports: ['CngxEmptyState'],
      template: `
  <div class="table-wrap">
    <table class="demo-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Room</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        @if (tableItems().length === 0) {
          <tr>
            <td colspan="3" style="padding:0">
              <cngx-empty-state
                title="No patients found"
                description="Adjust filters or add a new patient.">
                <svg cngxEmptyStateIcon width="40" height="40" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="17" y1="11" x2="23" y2="11" />
                </svg>
                <button cngxEmptyStateAction class="chip">Add patient</button>
              </cngx-empty-state>
            </td>
          </tr>
        }
      </tbody>
    </table>
  </div>`,
    },
    {
      title: 'Inside a List',
      subtitle:
        'Replaces list content when empty. Works with any container — no special wiring needed.',
      imports: ['CngxEmptyState'],
      template: `
  <div style="border:1px solid var(--border-color,#e0e0e0);border-radius:8px;min-height:120px;display:flex;align-items:center;justify-content:center">
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
    },
  ],
};
