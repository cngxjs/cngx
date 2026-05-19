import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Slot overrides — prefix / label / suffix',
  subtitle: 'Project <code>&lt;ng-template cngxTagPrefix&gt;</code>, <code>&lt;ng-template cngxTagLabel&gt;</code>, or <code>&lt;ng-template cngxTagSuffix&gt;</code> to control each region. Prefix and suffix slots render no DOM when omitted; the default label wraps content in <code>cngx-tag__label</code> for ellipsis support.',
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
    'import { CngxTag, CngxTagPrefix, CngxTagSuffix, CngxIcon } from \'@cngx/common/display\';',
  ],
  imports: ['CngxTag', 'CngxTagPrefix', 'CngxTagSuffix', 'CngxIcon'],
  template: `
  <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
    <span cngxTag color="success">
      <ng-template cngxTagPrefix>
        <cngx-icon size="sm" aria-hidden="true">
          <svg viewBox="0 0 16 16" focusable="false"><path fill="currentColor" d="M6.5 11.5 3 8l1.4-1.4 2.1 2.1L11.6 4l1.4 1.4z" /></svg>
        </cngx-icon>
      </ng-template>
      Active
    </span>
    <span cngxTag color="info">
      Frontend
      <ng-template cngxTagSuffix>
        <cngx-icon size="sm" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" focusable="false"><path d="m4 6 4 4 4-4" /></svg>
        </cngx-icon>
      </ng-template>
    </span>
    <span cngxTag color="warning">
      <ng-template cngxTagPrefix>
        <cngx-icon size="sm" aria-hidden="true">
          <svg viewBox="0 0 16 16" focusable="false"><circle cx="8" cy="8" r="4" fill="currentColor" /></svg>
        </cngx-icon>
      </ng-template>
      Pending review
    </span>
  </div>`,
  css: `.row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }`,
};
