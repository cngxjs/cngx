import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Standalone Metrics',
  subtitle: 'Number formatted with locale. Unit displayed as suffix. Null renders em-dash.',
  description: 'Displays a locale-aware formatted number with optional unit. Composable — works inside any card variant or standalone.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxMetric',
  ],
  moduleImports: [
    'import { CngxMetric } from \'@cngx/common/data\';',
  ],
  imports: ['CngxMetric'],
  template: `
  <div style="display:flex;gap:48px;align-items:baseline;flex-wrap:wrap">
    <div>
      <div style="font-size:0.75rem;color:var(--cngx-color-text-muted);margin-bottom:4px">Integer</div>
      <cngx-metric [value]="1234" />
    </div>
    <div>
      <div style="font-size:0.75rem;color:var(--cngx-color-text-muted);margin-bottom:4px">With unit</div>
      <cngx-metric [value]="75" unit="bpm" />
    </div>
    <div>
      <div style="font-size:0.75rem;color:var(--cngx-color-text-muted);margin-bottom:4px">Formatted</div>
      <cngx-metric [value]="99.6" unit="%" [format]="{ maximumFractionDigits: 1 }" />
    </div>
    <div>
      <div style="font-size:0.75rem;color:var(--cngx-color-text-muted);margin-bottom:4px">Null</div>
      <cngx-metric [value]="null" unit="kg" />
    </div>
    <div>
      <div style="font-size:0.75rem;color:var(--cngx-color-text-muted);margin-bottom:4px">String</div>
      <cngx-metric value="n.b." />
    </div>
  </div>`,
};
