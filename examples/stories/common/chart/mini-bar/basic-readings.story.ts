import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMiniBar: Basic readings',
  subtitle:
    'Default 80px width; theming via <code>--cngx-bar-color</code> with fallback to <code>--cngx-chart-primary</code>.',
  description:
    'Three rows pair a label, the bar, and a numeric readout. The "Critical" row overrides <code>--cngx-bar-color</code> to communicate severity; the rest follow the default palette.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxMiniBar'],
  moduleImports: ["import { CngxMiniBar } from '@cngx/common/chart';"],
  imports: ['CngxMiniBar'],
  template: `  <div style="display:flex;flex-direction:column;gap:12px;max-width:300px">
    <div style="display:flex;align-items:center;gap:12px">
      <span style="flex:1">Battery</span>
      <cngx-mini-bar [value]="78" aria-label="Battery 78%" />
      <span style="width:40px;text-align:right">78%</span>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <span style="flex:1">Disk</span>
      <cngx-mini-bar [value]="42" aria-label="Disk 42%" />
      <span style="width:40px;text-align:right">42%</span>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <span style="flex:1">Critical</span>
      <cngx-mini-bar [value]="12" aria-label="Critical 12%"
        style="--cngx-bar-color: var(--cngx-color-danger, #d2452f)" />
      <span style="width:40px;text-align:right">12%</span>
    </div>
  </div>`,
};
