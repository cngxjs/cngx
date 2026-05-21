import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTag: truncate and max-width',
  subtitle: 'Visual-only truncation: <code>[truncate]</code> applies <code>text-overflow: ellipsis</code> to the inner label span; <code>[maxWidth]</code> caps the host width. The full text stays in the DOM for assistive tech.',
  description: 'Pair the two inputs for a hard upper bound. The clipping lives in CSS, never in the DOM: assistive tech still reads "A very long taxonomy label that overflows" verbatim, and user-side text-spacing or resize overrides recover the full string without forking the template.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: ['CngxTag'],
  moduleImports: ["import { CngxTag } from '@cngx/common/display';"],
  imports: ['CngxTag'],
  references: [
    {
      label: 'WCAG 2.2 SC 1.4.4 Resize Text',
      href: 'https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html',
    },
    {
      label: 'WCAG 2.2 SC 1.4.12 Text Spacing',
      href: 'https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html',
    },
  ],
  template: `
  <div class="demo-tag-row">
    <span cngxTag color="neutral" [truncate]="true" maxWidth="8rem">A very long taxonomy label that overflows</span>
    <span cngxTag color="info" [truncate]="true" maxWidth="12rem">Another lengthy descriptor here</span>
  </div>`,
};
