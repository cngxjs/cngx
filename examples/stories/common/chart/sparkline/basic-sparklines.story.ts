import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSparkline: Basic sparklines',
  subtitle:
    'Default size; theming via <code>--cngx-sparkline-color</code> with fallback to <code>--cngx-chart-primary</code>.',
  description:
    'Three KPI rows pair a small label with the line and a trailing numeric readout. The error row tints the sparkline via the public custom property; the others use the default palette.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxSparkline'],
  moduleImports: ["import { CngxSparkline } from '@cngx/common/chart';"],
  imports: ['CngxSparkline'],
  template: `  <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
    <div>
      <span class="cngx-ex-status-readout" style="margin-right:8px">CPU</span>
      <cngx-sparkline [data]="[12, 15, 11, 18, 22, 19, 24]" />
      <span style="margin-left:8px">24%</span>
    </div>
    <div>
      <span class="cngx-ex-status-readout" style="margin-right:8px">Memory</span>
      <cngx-sparkline [data]="[60, 62, 58, 64, 68, 71, 70]" />
      <span style="margin-left:8px">70%</span>
    </div>
    <div>
      <span class="cngx-ex-status-readout" style="margin-right:8px">Errors</span>
      <cngx-sparkline
        [data]="[0, 1, 0, 0, 2, 0, 0]"
        style="--cngx-sparkline-color: var(--cngx-color-danger, #d2452f)"
      />
      <span style="margin-left:8px">3</span>
    </div>
  </div>`,
};
