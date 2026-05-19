import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'App-wide defaults via provideTagConfig',
  subtitle: 'Wrap a sub-tree in <code>provideTagConfigAt(...)</code> (component-scoped) or pass the same features to <code>provideTagConfig(...)</code> at <code>bootstrapApplication</code> for app-wide defaults. Four feature factories compose freely: <code>withTagDefaults</code> / <code>withTagGroupDefaults</code> / <code>withTagColors</code> / <code>withTagSlots</code>. Resolution priority: per-instance Input → <code>viewProviders</code> → root provider → library defaults. The tags below mimic the cascade result with inline bindings — in a real app, none of these per-instance values would be needed.',
  description: 'Decorative label / badge / status indicator. Dual selector ([cngxTag] and <cngx-tag>) so it composes onto any host element including <a> for link-mode tags. Removable affordances live in CngxChip; clickable interactions live on native <button cngxTag> / <a cngxTag>.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition', 'a11y-pattern'],
  apiComponents: [
    'CngxTag',
    'CngxTagLabel',
    'CngxTagPrefix',
    'CngxTagSuffix',
    'CngxIcon',
    'CngxTagGroup',
    'CngxTagGroupHeader',
    'CngxTagGroupAccessory',
  ],
  moduleImports: [
    'import { CngxTag } from \'@cngx/common/display\';',
  ],
  imports: ['CngxTag'],
  template: `
  <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
    <span cngxTag variant="subtle" color="info" size="sm">subtle/sm/info</span>
    <span cngxTag variant="subtle" color="success" size="sm">subtle/sm/success</span>
    <span cngxTag variant="subtle" color="my-brand" size="sm" style="--cngx-tag-bg: #4f46e5; --cngx-tag-color: #ffffff;">subtle/sm/my-brand</span>
  </div>`,
  css: `/* Consumer setup mirrored by the inline bindings above:
provideTagConfigAt(
  withTagDefaults({ variant: 'subtle', size: 'sm' }),
  withTagColors({
    'my-brand': { bg: '#4f46e5', color: '#ffffff', border: 'transparent' },
  }),
)
*/`,
};
