import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Trend Directions',
  subtitle: 'Positive (green, up arrow), negative (red, down arrow), and zero (neutral, right arrow).',
  description: 'Displays a directional trend indicator with arrow icon and formatted percentage. Consumer can override the SR label for full context.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxTrend',
  ],
  moduleImports: [
    'import { CngxTrend } from \'@cngx/common/data\';',
  ],
  imports: ['CngxTrend'],
  template: `
  <div style="display:flex;gap:32px;align-items:center">
    <div style="text-align:center">
      <div style="font-size:0.75rem;color:var(--cngx-color-text-muted);margin-bottom:8px">Positive</div>
      <cngx-trend [value]="5.3" />
    </div>
    <div style="text-align:center">
      <div style="font-size:0.75rem;color:var(--cngx-color-text-muted);margin-bottom:8px">Negative</div>
      <cngx-trend [value]="-2.1" />
    </div>
    <div style="text-align:center">
      <div style="font-size:0.75rem;color:var(--cngx-color-text-muted);margin-bottom:8px">Flat</div>
      <cngx-trend [value]="0" />
    </div>
  </div>`,
};
