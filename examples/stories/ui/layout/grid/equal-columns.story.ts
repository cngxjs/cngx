import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxGrid: Equal columns',
  subtitle: '<code>columns="3"</code> renders an equal-fraction grid with the default <code>16px</code> gap.',
  description: 'Integer <code>columns</code> resolves to <code>repeat(N, 1fr)</code>. Track-list strings like <code>columns="200px 1fr"</code> pass through verbatim as the <code>grid-template-columns</code> value. Bare attribute and <code>[columns]</code> binding produce identical output.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxGrid'],
  moduleImports: [
    'import { CngxGrid } from \'@cngx/ui/layout\';',
  ],
  imports: ['CngxGrid'],
  template: `
  <cngx-grid columns="3">
    <div class="demo-layout-cell">Item A</div>
    <div class="demo-layout-cell">Item B</div>
    <div class="demo-layout-cell">Item C</div>
    <div class="demo-layout-cell">Item D</div>
    <div class="demo-layout-cell">Item E</div>
    <div class="demo-layout-cell">Item F</div>
  </cngx-grid>`,
};
