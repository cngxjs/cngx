import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Composed with Metric in a Card',
  subtitle: 'Trend and Metric combine naturally inside a card — no pre-built molecule needed.',
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
    'import { CngxMetric } from \'@cngx/common/data\';',
    'import { CngxCard, CngxCardHeader, CngxCardBody } from \'@cngx/common/card\';',
  ],
  imports: ['CngxTrend', 'CngxMetric', 'CngxCard', 'CngxCardHeader', 'CngxCardBody'],
  template: `
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;max-width:660px">
    <cngx-card>
      <header cngxCardHeader style="justify-content:space-between">
        <span style="font-size:0.8125rem;color:var(--cngx-color-text-muted)">Revenue</span>
        <cngx-trend [value]="12.5" label="+12.5% vs. last quarter" />
      </header>
      <div cngxCardBody>
        <cngx-metric [value]="48200" unit="EUR" [format]="{ maximumFractionDigits: 0 }" />
      </div>
    </cngx-card>
    <cngx-card>
      <header cngxCardHeader style="justify-content:space-between">
        <span style="font-size:0.8125rem;color:var(--cngx-color-text-muted)">Care Hours</span>
        <cngx-trend [value]="-3.2" />
      </header>
      <div cngxCardBody>
        <cngx-metric [value]="156.5" unit="h" [format]="{ maximumFractionDigits: 1 }" />
      </div>
    </cngx-card>
    <cngx-card>
      <header cngxCardHeader style="justify-content:space-between">
        <span style="font-size:0.8125rem;color:var(--cngx-color-text-muted)">Residents</span>
        <cngx-trend [value]="0" />
      </header>
      <div cngxCardBody>
        <cngx-metric [value]="42" />
      </div>
    </cngx-card>
  </div>`,
};
