import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Colors and dot mode',
  subtitle: 'Boolean <code>true</code> flips to dot mode (no text).',
  description: 'Floating counter / dot indicator attached to any host element. Purely visual — semantics live on the host via aria-label.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxBadge',
  ],
  moduleImports: [
    'import { CngxBadge } from \'@cngx/common/display\';',
  ],
  imports: ['CngxBadge'],
  template: `
  <div class="row">
    <button type="button" class="chip" [cngxBadge]="1" color="error">Errors</button>
    <button type="button" class="chip" [cngxBadge]="5" color="warning">Warnings</button>
    <button type="button" class="chip" [cngxBadge]="2" color="neutral">Drafts</button>
    <button type="button" class="chip" [cngxBadge]="true" color="error" aria-label="new notifications">Live</button>
  </div>`,
};
