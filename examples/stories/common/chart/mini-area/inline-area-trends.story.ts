import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMiniArea: Inline area trends',
  subtitle:
    'Default 80x24, theming via <code>--cngx-mini-area-color</code> with fallback to <code>--cngx-chart-primary</code>.',
  description:
    'Two area sparks side by side: the first runs the default size and palette, the second overrides width / height and tints the fill via the public custom property. No axis, no labels, just the trend.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxMiniArea'],
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
  moduleImports: ["import { CngxMiniArea } from '@cngx/common/chart';"],
  imports: ['CngxMiniArea'],
  template: `  <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
    <div>
      <span class="cngx-ex-status-readout" style="margin-right:8px">Sessions</span>
      <cngx-mini-area [data]="[5, 12, 8, 18, 14, 22, 19]" />
    </div>
    <div>
      <span class="cngx-ex-status-readout" style="margin-right:8px">Revenue</span>
      <cngx-mini-area
        [data]="[10, 14, 18, 16, 22, 28, 32]"
        [width]="120"
        [height]="32"
        style="--cngx-mini-area-color: var(--cngx-color-success, #1f9d55)"
      />
    </div>
  </div>`,
};
