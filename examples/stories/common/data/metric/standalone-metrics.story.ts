import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMetric: Standalone metrics',
  subtitle: 'Number formatted with locale. Unit displayed as suffix. <code>null</code> renders an em-dash.',
  description: 'Locale-aware number formatting with optional unit. The full variant matrix: integer, with unit, formatted via <code>Intl.NumberFormatOptions</code>, null fallback, and string passthrough.',
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
      <div class="demo-metric-label">Integer</div>
      <cngx-metric [value]="1234" />
    </div>
    <div>
      <div class="demo-metric-label">With unit</div>
      <cngx-metric [value]="75" unit="bpm" />
    </div>
    <div>
      <div class="demo-metric-label">Formatted</div>
      <cngx-metric [value]="99.6" unit="%" [format]="{ maximumFractionDigits: 1 }" />
    </div>
    <div>
      <div class="demo-metric-label">Null</div>
      <cngx-metric [value]="null" unit="kg" />
    </div>
    <div>
      <div class="demo-metric-label">String</div>
      <cngx-metric value="n.b." />
    </div>
  </div>`,
};
