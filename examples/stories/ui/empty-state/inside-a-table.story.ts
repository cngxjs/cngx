import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxEmptyState: inside a table',
  subtitle: 'Replaces table body when no rows match. The table header stays visible for context.',
  description: 'Spans a full-width <code>td colspan</code> so the header row stays anchored while the body becomes a single empty-state cell. Includes a row-add primary action so the empty state is also the recovery path.',
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
  setup: `protected tableItems = signal<string[]>([]);`,
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
                <button cngxEmptyStateAction class="chip" type="button">Add patient</button>
              </cngx-empty-state>
            </td>
          </tr>
        }
      </tbody>
    </table>
  </div>`,
};
