import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTag: app-wide defaults via provideTagConfig',
  subtitle: 'Wrap a sub-tree in <code>provideTagConfigAt(...)</code> or hand the same features to <code>provideTagConfig(...)</code> at <code>bootstrapApplication</code>. Four feature factories compose: <code>withTagDefaults</code>, <code>withTagGroupDefaults</code>, <code>withTagColors</code>, <code>withTagSlots</code>.',
  description: 'How per-instance Input, viewProviders, root provider, and library defaults resolve in that priority order. The tags below mimic the cascade result with inline bindings; in a real app the per-instance values would not be needed.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxTag'],
  moduleImports: ["import { CngxTag } from '@cngx/common/display';"],
  imports: ['CngxTag'],
  template: `
  <div class="demo-tag-row">
    <span cngxTag variant="subtle" color="info" size="sm">subtle/sm/info</span>
    <span cngxTag variant="subtle" color="success" size="sm">subtle/sm/success</span>
    <span cngxTag variant="subtle" color="my-brand" size="sm">subtle/sm/my-brand</span>
  </div>`,
  css: `/* Consumer setup mirrored by the inline bindings above:
provideTagConfigAt(
  withTagDefaults({ variant: 'subtle', size: 'sm' }),
  withTagColors({
    'my-brand': { bg: 'var(--cngx-color-primary)', color: 'var(--cngx-color-on-primary)', border: 'transparent' },
  }),
)
*/`,
};
