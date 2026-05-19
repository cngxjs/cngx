import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Truncate + maxWidth',
  subtitle: 'Visual-only truncation — full text remains in the DOM for assistive tech.',
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
    <span cngxTag color="neutral" [truncate]="true" maxWidth="8rem">A very long taxonomy label that overflows</span>
    <span cngxTag color="info" [truncate]="true" maxWidth="12rem">Another lengthy descriptor here</span>
  </div>`,
  css: `.row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }`,
};
