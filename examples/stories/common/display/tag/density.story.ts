import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTag: density',
  subtitle: 'Four density steps scale padding and font-size; <code>md</code> is the default.',
  description: 'Each step drives the <code>--cngx-tag-{sm|md|lg|xl}-padding</code> and matching <code>-font-size</code> custom properties; nested atom sizes (icon, avatar) remain the consumer\'s call.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxTag'],
  moduleImports: ["import { CngxTag } from '@cngx/common/display';"],
  imports: ['CngxTag'],
  template: `
  <div class="demo-tag-row">
    <span cngxTag size="sm" color="info">Small</span>
    <span cngxTag size="md" color="info">Medium</span>
    <span cngxTag size="lg" color="info">Large</span>
    <span cngxTag size="xl" color="info">Extra large</span>
  </div>`,
};
