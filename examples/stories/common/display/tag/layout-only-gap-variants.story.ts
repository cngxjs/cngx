import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Layout-only — gap variants',
  subtitle: 'Without <code>[semanticList]</code> the group is a decorative flex-wrap row; <code>[gap]</code> scales the spacing through <code>--cngx-tag-group-gap-*</code> custom properties.',
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
    'import { CngxTag, CngxTagGroup } from \'@cngx/common/display\';',
  ],
  imports: ['CngxTag', 'CngxTagGroup'],
  template: `
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <cngx-tag-group gap="xs">
      <span cngxTag color="neutral">xs</span>
      <span cngxTag color="neutral">gap</span>
      <span cngxTag color="neutral">tight</span>
    </cngx-tag-group>
    <cngx-tag-group gap="sm">
      <span cngxTag color="neutral">sm</span>
      <span cngxTag color="neutral">gap</span>
      <span cngxTag color="neutral">default</span>
    </cngx-tag-group>
    <cngx-tag-group gap="md">
      <span cngxTag color="neutral">md</span>
      <span cngxTag color="neutral">gap</span>
      <span cngxTag color="neutral">roomy</span>
    </cngx-tag-group>
  </div>`,
  css: `cngx-tag-group { /* gap resolves through --cngx-tag-group-gap-{xs,sm,md} */ }`,
};
