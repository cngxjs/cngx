import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxEmptyState: with custom icon and actions',
  subtitle: 'Project any icon via <code>[cngxEmptyStateIcon]</code>. Primary and secondary action slots.',
  description: 'All three slots exercised: a custom search-no-results glyph, a primary <code>cngxEmptyStateAction</code> button to reset filters, and a secondary <code>cngxEmptyStateSecondary</code> link to the search-syntax docs.',
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
  <div class="demo-frame-card">
    <cngx-empty-state
      title="No results found"
      description="Try adjusting your search or filter criteria.">
      <svg cngxEmptyStateIcon width="48" height="48" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
      <button cngxEmptyStateAction class="chip" type="button">Reset filters</button>
      <a cngxEmptyStateSecondary href="#" class="demo-empty-state-link">
        Learn about search syntax
      </a>
    </cngx-empty-state>
  </div>`,
};
