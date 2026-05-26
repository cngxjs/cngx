import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxEmptyState: Inside a list',
  subtitle: 'Replaces list content when empty. Works with any container - no special wiring needed.',
  description: 'No grid, no special slot: just an <code>@if</code> guard around the rendered list. Demonstrates that the organism carries its own framing chrome and drops into any container without configuration.',
  level: 'organism',
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
  <div class="demo-frame-list">
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
