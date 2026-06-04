import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTag: prefix and suffix slots',
  subtitle: 'Project <code>&lt;ng-template cngxTagPrefix&gt;</code>, <code>&lt;ng-template cngxTagLabel&gt;</code>, or <code>&lt;ng-template cngxTagSuffix&gt;</code> to control each region. Prefix and suffix render no DOM when omitted; the default label wraps content in <code>cngx-tag__label</code> for ellipsis support.',
  description: 'The three positional slots are independent; mix and match per host. Every projected <code>&lt;cngx-icon&gt;</code> carries <code>aria-hidden="true"</code> so the icons stay decorative; the label text ("Active", "Frontend", "Pending review") is the sole accessible name and the prefix / suffix glyphs add nothing to it.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxTag', 'CngxTagPrefix', 'CngxTagSuffix', 'CngxIcon'],
  moduleImports: ["import { CngxTag, CngxTagPrefix, CngxTagSuffix, CngxIcon } from '@cngx/common/display';"],
  imports: ['CngxTag', 'CngxTagPrefix', 'CngxTagSuffix', 'CngxIcon'],
  references: [
    {
      label: 'WAI Web Accessibility Tutorials: Decorative Images',
      href: 'https://www.w3.org/WAI/tutorials/images/decorative/',
    },
    {
      label: 'WCAG 2.2 SC 1.1.1 Non-text Content',
      href: 'https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html',
    },
  ],
  template: `
  <div class="demo-tag-row">
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
};
