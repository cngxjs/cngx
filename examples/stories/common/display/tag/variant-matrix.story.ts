import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Variant matrix',
  subtitle: 'Same colour, three visual variants — filled, outline, subtle.',
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
    <span cngxTag variant="filled" color="success">Filled</span>
    <span cngxTag variant="outline" color="success">Outline</span>
    <span cngxTag variant="subtle" color="success">Subtle</span>
  </div>`,
  css: `.row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }`,
};
