import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTag: composition with CngxIcon',
  subtitle: 'Drop <code>&lt;cngx-icon&gt;</code> directly inside <code>&lt;span cngxTag&gt;</code>. No tag-specific icon atom is needed; the icon handles its own sizing and decorative <code>aria-hidden</code>.',
  description: 'Pillar 3 in action: two narrow atoms compose without a hybrid wrapper. Each <code>&lt;cngx-icon&gt;</code> carries <code>aria-hidden="true"</code> so the icon stays decorative; the visible text (Active / Pending / Failed) is the accessible name. Pair with colour as a redundant signal, never as the only one.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxTag', 'CngxIcon'],
  moduleImports: ["import { CngxTag, CngxIcon } from '@cngx/common/display';"],
  imports: ['CngxTag', 'CngxIcon'],
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
      <cngx-icon size="sm" aria-hidden="true">
        <svg viewBox="0 0 16 16" focusable="false"><path fill="currentColor" d="M6.5 11.5 3 8l1.4-1.4 2.1 2.1L11.6 4l1.4 1.4z" /></svg>
      </cngx-icon>
      Active
    </span>
    <span cngxTag color="warning">
      <cngx-icon size="sm" aria-hidden="true">
        <svg viewBox="0 0 16 16" focusable="false"><circle cx="8" cy="8" r="4" fill="currentColor" /></svg>
      </cngx-icon>
      Pending
    </span>
    <span cngxTag color="error">
      <cngx-icon size="sm" aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" focusable="false"><path d="m4 4 8 8m0-8-8 8" /></svg>
      </cngx-icon>
      Failed
    </span>
  </div>`,
};
