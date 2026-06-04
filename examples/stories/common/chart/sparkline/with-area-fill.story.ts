import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSparkline: With area fill',
  subtitle:
    '<code>[showArea]="true"</code> draws the filled area under the line. Two sparks side by side, one default palette, one tinted green.',
  description:
    'Same sparkline as the basic variant with the area-fill layer enabled. The area uses the same colour token as the line, so a single <code>--cngx-sparkline-color</code> override changes both at once.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxSparkline'],
  references: [
    {
      label: 'WCAG 1.1.1 Non-text Content',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
    },
    {
      label: 'W3C WAI: Complex images',
      href: 'https://www.w3.org/WAI/tutorials/images/complex/',
    },
  ],
  moduleImports: ["import { CngxSparkline } from '@cngx/common/chart';"],
  imports: ['CngxSparkline'],
  template: `  <div style="display:flex;gap:24px;flex-wrap:wrap">
    <cngx-sparkline [data]="[5, 12, 8, 18, 14, 22, 19]" [showArea]="true" [width]="120" [height]="32" />
    <cngx-sparkline [data]="[20, 18, 22, 16, 14, 18, 21]" [showArea]="true" [width]="120" [height]="32"
      style="--cngx-sparkline-color: var(--cngx-color-success, #1f9d55)" />
  </div>`,
};
