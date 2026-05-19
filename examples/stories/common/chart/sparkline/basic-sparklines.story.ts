import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Basic sparklines',
  subtitle: 'Default size, theming via CSS custom properties.',
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
  <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
    <div>
      <span style="font-size:0.75rem;color:var(--cngx-color-text-muted);margin-right:8px">CPU</span>
      <cngx-sparkline [data]="[12, 15, 11, 18, 22, 19, 24]" />
      <span style="margin-left:8px;font-weight:600">24%</span>
    </div>
    <div>
      <span style="font-size:0.75rem;color:var(--cngx-color-text-muted);margin-right:8px">Memory</span>
      <cngx-sparkline [data]="[60, 62, 58, 64, 68, 71, 70]" />
      <span style="margin-left:8px;font-weight:600">70%</span>
    </div>
    <div>
      <span style="font-size:0.75rem;color:var(--cngx-color-text-muted);margin-right:8px">Errors</span>
      <cngx-sparkline
        [data]="[0, 1, 0, 0, 2, 0, 0]"
        style="--cngx-sparkline-color: var(--danger, #d2452f)"
      />
      <span style="margin-left:8px;font-weight:600;color:var(--danger,#d2452f)">3</span>
    </div>
  </div>`,
};
