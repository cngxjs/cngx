import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMiniBar: Named meters',
  subtitle:
    'Binding <code>label</code> renders a caption above each track and names the meter for assistive technology - no consumer-side <code>&lt;dt&gt;</code> or <code>aria-label</code> scaffolding.',
  description:
    'A column of meters each carrying only <code>[value]</code> and <code>label</code>. The caption is the visible name and the accessible name at once: with no <code>[aria-label]</code> bound the host resolves <code>role="meter"</code> to the caption text, so an AX snapshot reads <code>meter "CPU"</code> rather than an unnamed meter. Bind <code>[aria-label]</code> to override the announced name while keeping the visible caption.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern'],
  apiComponents: ['CngxMiniBar'],
  references: [
    {
      label: 'WAI-ARIA: meter role',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#meter',
    },
    {
      label: 'WCAG 1.1.1 Non-text Content',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
    },
  ],
  moduleImports: ["import { CngxMiniBar } from '@cngx/common/chart';"],
  imports: ['CngxMiniBar'],
  template: `  <div style="display:flex;flex-direction:column;gap:16px;max-width:260px">
    <cngx-mini-bar [value]="78" label="CPU" />
    <cngx-mini-bar [value]="42" label="Memory" />
    <cngx-mini-bar
      [value]="12"
      label="Disk"
      style="--cngx-bar-color: var(--cngx-color-danger, #d2452f)"
    />
  </div>`,
};
