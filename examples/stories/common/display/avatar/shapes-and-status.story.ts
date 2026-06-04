import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAvatar: Shapes and status',
  subtitle: 'Circle (default) or square. Optional presence status with <code>aria-label</code>.',
  description: 'Three circle avatars show the four presence values (`online`, `busy`, `away`, `offline`) rendered as a status dot. The fourth switches `shape` to `square` so the rounded-square radius token is visible. Each dot carries an `aria-label` set to its status value so the presence state is exposed to assistive tech instead of being communicated by color alone.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: [
    'CngxAvatar',
  ],
  moduleImports: [
    'import { CngxAvatar } from \'@cngx/common/display\';',
  ],
  imports: ['CngxAvatar'],
  references: [
    { label: 'WAI-ARIA 1.2: `aria-label`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-label' },
    { label: 'WCAG 2.1 SC 1.4.1 Use of Color', href: 'https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html' },
  ],
  template: `
  <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap">
    <cngx-avatar initials="ON" status="online"></cngx-avatar>
    <cngx-avatar initials="BS" status="busy"></cngx-avatar>
    <cngx-avatar initials="AW" status="away"></cngx-avatar>
    <cngx-avatar initials="OF" status="offline" shape="square"></cngx-avatar>
  </div>`,
};
