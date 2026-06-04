import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDivider: Inset',
  subtitle: 'The <code>inset</code> modifier adds margin on the inline axis, useful inside lists.',
  description: 'Two items separated by a divider with <code>[inset]="true"</code>. The inset modifier drops the line in from the container start/end edges by <code>--cngx-divider-inset-amount</code> (default 16px), so the separator aligns with the indented item text rather than running flush to the panel boundary. The host still carries <code>role="separator"</code>, so the structural meaning is preserved for assistive tech regardless of the visual indent. Common pattern inside <code>cngx-card</code> or list-row layouts.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: [
    'CngxDivider',
  ],
  moduleImports: [
    'import { CngxDivider } from \'@cngx/common/display\';',
  ],
  imports: ['CngxDivider'],
  references: [
    { label: 'WAI-ARIA 1.2: `separator` role', href: 'https://www.w3.org/TR/wai-aria-1.2/#separator' },
    { label: 'WCAG 2.1 SC 1.4.11 Non-text Contrast', href: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html' },
  ],
  template: `
  <div>Item A</div>
  <cngx-divider [inset]="true"></cngx-divider>
  <div>Item B</div>`,
};
