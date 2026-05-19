import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Layout-only — alignment',
  subtitle: 'When the group has more horizontal room than its tags, <code>[align]</code> picks the cross-axis distribution. <code>between</code> resolves to <code>justify-content: space-between</code>.',
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
    <cngx-tag-group align="start" style="border: 1px dashed #d1d5db; padding: 8px; min-width: 24rem;">
      <span cngxTag color="info">start</span>
      <span cngxTag color="info">align</span>
    </cngx-tag-group>
    <cngx-tag-group align="center" style="border: 1px dashed #d1d5db; padding: 8px; min-width: 24rem;">
      <span cngxTag color="info">center</span>
      <span cngxTag color="info">align</span>
    </cngx-tag-group>
    <cngx-tag-group align="end" style="border: 1px dashed #d1d5db; padding: 8px; min-width: 24rem;">
      <span cngxTag color="info">end</span>
      <span cngxTag color="info">align</span>
    </cngx-tag-group>
    <cngx-tag-group align="between" style="border: 1px dashed #d1d5db; padding: 8px; min-width: 24rem;">
      <span cngxTag color="info">between</span>
      <span cngxTag color="info">align</span>
    </cngx-tag-group>
  </div>`,
  css: `cngx-tag-group[align="between"] { justify-content: space-between; }`,
};
