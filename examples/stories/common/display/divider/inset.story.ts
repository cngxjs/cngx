import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Inset',
  subtitle: 'The <code>inset</code> modifier adds margin on the inline axis — useful inside lists.',
  description: 'Presentational separator with proper ARIA semantics. Horizontal or vertical, optionally inset.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxDivider',
  ],
  moduleImports: [
    'import { CngxDivider } from \'@cngx/common/display\';',
  ],
  imports: ['CngxDivider'],
  template: `
  <div class="section">Item A</div>
  <cngx-divider [inset]="true"></cngx-divider>
  <div class="section">Item B</div>`,
};
