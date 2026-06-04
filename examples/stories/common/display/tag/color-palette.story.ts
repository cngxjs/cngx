import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTag: color palette',
  subtitle: 'Five predefined semantic colour keys plus open-string extension via the <code>[data-color]</code> attribute.',
  description: 'Consumer-defined colour keys flow through the same <code>--cngx-tag-{name}-bg/-color/-border</code> cascade as the predefined values; the example app ships a <code>[data-color="my-brand"]</code> rule that maps onto the cngx primary token.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxTag'],
  moduleImports: ["import { CngxTag } from '@cngx/common/display';"],
  imports: ['CngxTag'],
  template: `
  <div class="demo-tag-row">
    <span cngxTag color="neutral">Neutral</span>
    <span cngxTag color="success">Active</span>
    <span cngxTag color="warning">Pending</span>
    <span cngxTag color="error">Failed</span>
    <span cngxTag color="info">Beta</span>
    <span cngxTag color="my-brand">Branded</span>
  </div>`,
  css: `/* Consumer-side rule that backs the [data-color="my-brand"] tag:
[data-color="my-brand"] {
  --cngx-tag-bg: var(--cngx-color-primary);
  --cngx-tag-color: var(--cngx-color-on-primary);
}
*/`,
};
