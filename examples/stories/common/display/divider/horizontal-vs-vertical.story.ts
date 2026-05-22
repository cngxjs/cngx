import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDivider: Horizontal vs vertical',
  subtitle: 'Default orientation is horizontal. Use vertical in flex rows to split inline content.',
  description: 'Two layouts contrast the orientations. The first stacks two rows separated by the default horizontal divider, which renders as a full-width hairline with its own block margin (no surrounding padding needed). The second sets <code>orientation="vertical"</code> on a divider inside a flex row, so it stretches between two inline spans and switches its breathing room to the inline axis. The host carries <code>role="separator"</code> and a reactive <code>aria-orientation</code> binding, so assistive tech announces the correct axis whenever the input flips.',
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
    { label: 'WAI-ARIA 1.2: `aria-orientation`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-orientation' },
    { label: 'WCAG 2.1 SC 1.4.11 Non-text Contrast', href: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html' },
  ],
  template: `
  <div>First row</div>
  <cngx-divider></cngx-divider>
  <div>Second row</div>
  <div style="display:flex; align-items:center; gap:12px; margin-top:16px">
    <span>left</span>
    <cngx-divider orientation="vertical"></cngx-divider>
    <span>right</span>
  </div>`,
};
