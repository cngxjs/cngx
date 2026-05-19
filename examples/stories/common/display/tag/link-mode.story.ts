import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Link mode',
  subtitle: 'Native <code>&lt;a cngxTag&gt;</code> preserves anchor semantics — focus, keyboard, navigation.',
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
    <a cngxTag color="info" href="#category/frontend" style="text-decoration: none;">frontend</a>
    <a cngxTag color="success" href="#category/cleared" style="text-decoration: none;">cleared</a>
    <a cngxTag color="warning" href="#category/pending" style="text-decoration: none;">pending</a>
  </div>`,
  css: `.row { display: flex; gap: 12px; align-items: center; }
.row a { text-decoration: none; }
.row a:hover { filter: brightness(0.92); }`,
};
