import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTag: color palette',
  subtitle: 'Five predefined semantic colour keys plus open-string extension via the <code>[data-color]</code> attribute.',
  description: 'Consumer-defined colour keys register through <code>withTagColors</code>; the directive emits the entry as element-level <code>--cngx-tag-bg/-color/-border</code> values whenever <code>color</code> resolves to the key. The "Branded" tag below is backed by a live <code>provideTagConfigAt</code> registration, not example CSS.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxTag'],
  moduleImports: [
    "import { CngxTag, provideTagConfigAt, withTagColors } from '@cngx/common/display';",
  ],
  imports: ['CngxTag'],
  viewProviders: [
    "provideTagConfigAt(withTagColors({ 'my-brand': { bg: 'var(--cngx-color-primary, #4f46e5)', color: 'var(--cngx-color-on-primary, #ffffff)', border: 'transparent' } }))",
  ],
  template: `
  <div class="demo-tag-row">
    <span cngxTag color="neutral">Neutral</span>
    <span cngxTag color="success">Active</span>
    <span cngxTag color="warning">Pending</span>
    <span cngxTag color="error">Failed</span>
    <span cngxTag color="info">Beta</span>
    <span cngxTag color="my-brand">Branded</span>
  </div>`,
};
