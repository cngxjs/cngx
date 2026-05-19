import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'With area fill',
  subtitle: 'Combine line + area for a filled trend.',
  description: 'Inline mini line chart for KPI cards and dashboard tiles. Composes <cngx-chart> + <cngx-line> + optional <cngx-area> with hidden axes.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxSparkline',
  ],
  moduleImports: [
    'import { CngxSparkline } from \'@cngx/common/chart\';',
  ],
  imports: ['CngxSparkline'],
  template: `
  <div style="display:flex;gap:24px;flex-wrap:wrap">
    <cngx-sparkline [data]="[5, 12, 8, 18, 14, 22, 19]" [showArea]="true" [width]="120" [height]="32" />
    <cngx-sparkline [data]="[20, 18, 22, 16, 14, 18, 21]" [showArea]="true" [width]="120" [height]="32"
      style="--cngx-sparkline-color: var(--success, #1f9d55)" />
  </div>`,
};
