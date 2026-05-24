import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxEmptyState: default no icon projected',
  subtitle: 'When no <code>[cngxEmptyStateIcon]</code> is projected, a built-in inbox SVG is shown.',
  description: 'Bare minimum usage: title and description only. Renders the built-in inbox glyph so first-use empty states never look unfinished.',
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
      title="No items yet"
      description="Create your first item to get started." />
  </div>`,
};
