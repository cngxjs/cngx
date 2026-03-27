import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Trend',
  navLabel: 'Trend',
  navCategory: 'card',
  description:
    'Displays a directional trend indicator with arrow icon and formatted percentage. Consumer can override the SR label for full context.',
  apiComponents: ['CngxTrend'],
  overview:
    '<p><code>cngx-trend</code> shows an up/down/flat arrow with the formatted percentage. ' +
    'The <code>label</code> input overrides the generated SR label — the consumer knows context better ' +
    '("vs. last month" vs. the generic default).</p>',
  moduleImports: [
    "import { CngxTrend } from '@cngx/common/card';",
    "import { CngxMetric, CngxCard, CngxCardHeader, CngxCardBody } from '@cngx/common/card';",
  ],
  sections: [
    {
      title: 'Trend Directions',
      subtitle: 'Positive (green, up arrow), negative (red, down arrow), and zero (neutral, right arrow).',
      imports: ['CngxTrend'],
      template: `
  <div style="display:flex;gap:32px;align-items:center">
    <div style="text-align:center">
      <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:8px">Positive</div>
      <cngx-trend [value]="5.3" />
    </div>
    <div style="text-align:center">
      <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:8px">Negative</div>
      <cngx-trend [value]="-2.1" />
    </div>
    <div style="text-align:center">
      <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:8px">Flat</div>
      <cngx-trend [value]="0" />
    </div>
  </div>`,
    },
    {
      title: 'Composed with Metric in a Card',
      subtitle: 'Trend and Metric combine naturally inside a card — no pre-built molecule needed.',
      imports: ['CngxTrend', 'CngxMetric', 'CngxCard', 'CngxCardHeader', 'CngxCardBody'],
      template: `
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;max-width:660px">
    <cngx-card>
      <header cngxCardHeader style="justify-content:space-between">
        <span style="font-size:0.8125rem;color:var(--text-muted)">Revenue</span>
        <cngx-trend [value]="12.5" label="+12.5% vs. last quarter" />
      </header>
      <div cngxCardBody>
        <cngx-metric [value]="48200" unit="EUR" [format]="{ maximumFractionDigits: 0 }" />
      </div>
    </cngx-card>
    <cngx-card>
      <header cngxCardHeader style="justify-content:space-between">
        <span style="font-size:0.8125rem;color:var(--text-muted)">Care Hours</span>
        <cngx-trend [value]="-3.2" />
      </header>
      <div cngxCardBody>
        <cngx-metric [value]="156.5" unit="h" [format]="{ maximumFractionDigits: 1 }" />
      </div>
    </cngx-card>
    <cngx-card>
      <header cngxCardHeader style="justify-content:space-between">
        <span style="font-size:0.8125rem;color:var(--text-muted)">Residents</span>
        <cngx-trend [value]="0" />
      </header>
      <div cngxCardBody>
        <cngx-metric [value]="42" />
      </div>
    </cngx-card>
  </div>`,
    },
  ],
};
