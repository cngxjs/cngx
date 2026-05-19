import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Composition with CngxIcon',
  subtitle: 'Drop <code>&lt;cngx-icon&gt;</code> directly inside <code>&lt;span cngxTag&gt;</code> — no tag-specific icon atom needed. CngxIcon handles sizing, vertical alignment, and <code>aria-hidden</code>.',
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
    'import { CngxTag, CngxIcon } from \'@cngx/common/display\';',
  ],
  imports: ['CngxTag', 'CngxIcon'],
  template: `
  <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
    <span cngxTag color="success">
      <cngx-icon size="sm">
        <svg viewBox="0 0 16 16" focusable="false"><path fill="currentColor" d="M6.5 11.5 3 8l1.4-1.4 2.1 2.1L11.6 4l1.4 1.4z" /></svg>
      </cngx-icon>
      Active
    </span>
    <span cngxTag color="warning">
      <cngx-icon size="sm">
        <svg viewBox="0 0 16 16" focusable="false"><circle cx="8" cy="8" r="4" fill="currentColor" /></svg>
      </cngx-icon>
      Pending
    </span>
    <span cngxTag color="error">
      <cngx-icon size="sm">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" focusable="false"><path d="m4 4 8 8m0-8-8 8" /></svg>
      </cngx-icon>
      Failed
    </span>
  </div>`,
  css: `.row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }`,
};
