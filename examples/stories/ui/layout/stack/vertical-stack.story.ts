import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStack: Vertical stack',
  subtitle: 'Default <code>direction="column"</code> with <code>gap="md"</code> (<code>--cngx-gap-md</code>, fallback <code>16px</code>).',
  description: 'Flex column with token-driven gap. The <code>xs</code>..<code>xl</code> scale resolves through <code>--cngx-gap-*</code> custom properties; override at any scope to match the host app\'s spacing scale.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxStack'],
  moduleImports: [
    'import { CngxStack } from \'@cngx/ui/layout\';',
  ],
  imports: ['CngxStack'],
  template: `
  <cngx-stack>
    <div class="demo-layout-cell">First row</div>
    <div class="demo-layout-cell">Second row</div>
    <div class="demo-layout-cell">Third row</div>
    <div class="demo-layout-cell">Fourth row</div>
  </cngx-stack>`,
};
