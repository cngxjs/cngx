import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Basic readings',
  subtitle: 'Default 80px width, theming via --cngx-bar-color → --cngx-chart-primary.',
  description: 'Single-value bounded indicator. Pure DOM (no SVG). Host carries role="meter" with reactive ARIA value attributes.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxMiniBar',
  ],
  moduleImports: [
    'import { CngxMiniBar } from \'@cngx/common/chart\';',
  ],
  imports: ['CngxMiniBar'],
  template: `
  <div style="display:flex;flex-direction:column;gap:12px;max-width:300px">
    <div style="display:flex;align-items:center;gap:12px">
      <span style="flex:1">Battery</span>
      <cngx-mini-bar [value]="78" aria-label="Battery 78%" />
      <span style="font-weight:600;width:40px;text-align:right">78%</span>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <span style="flex:1">Disk</span>
      <cngx-mini-bar [value]="42" aria-label="Disk 42%" />
      <span style="font-weight:600;width:40px;text-align:right">42%</span>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <span style="flex:1">Critical</span>
      <cngx-mini-bar [value]="12" aria-label="Critical 12%"
        style="--cngx-bar-color: var(--danger, #d2452f)" />
      <span style="font-weight:600;width:40px;text-align:right;color:var(--danger,#d2452f)">12%</span>
    </div>
  </div>`,
};
