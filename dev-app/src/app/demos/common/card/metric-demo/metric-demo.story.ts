import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Metric',
  navLabel: 'Metric',
  navCategory: 'card',
  description:
    'Displays a locale-aware formatted number with optional unit. Composable — works inside any card variant or standalone.',
  apiComponents: ['CngxMetric'],
  overview:
    '<p><code>cngx-metric</code> uses <code>Intl.NumberFormat</code> with the injected <code>LOCALE_ID</code>. ' +
    'Null values render as an em-dash. The <code>aria-label</code> includes value and unit.</p>',
  moduleImports: [
    "import { CngxMetric } from '@cngx/common/card';",
    "import { CngxCard, CngxCardHeader, CngxCardBody } from '@cngx/common/card';",
  ],
  sections: [
    {
      title: 'Standalone Metrics',
      subtitle: 'Number formatted with locale. Unit displayed as suffix. Null renders em-dash.',
      imports: ['CngxMetric'],
      template: `
  <div style="display:flex;gap:48px;align-items:baseline;flex-wrap:wrap">
    <div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">Integer</div>
      <cngx-metric [value]="1234" />
    </div>
    <div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">With unit</div>
      <cngx-metric [value]="75" unit="bpm" />
    </div>
    <div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">Formatted</div>
      <cngx-metric [value]="99.6" unit="%" [format]="{ maximumFractionDigits: 1 }" />
    </div>
    <div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">Null</div>
      <cngx-metric [value]="null" unit="kg" />
    </div>
    <div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">String</div>
      <cngx-metric value="n.b." />
    </div>
  </div>`,
    },
    {
      title: 'Inside a Card',
      subtitle: 'Metric as the primary value inside a card body — composable with any card archetype.',
      imports: ['CngxMetric', 'CngxCard', 'CngxCardHeader', 'CngxCardBody'],
      template: `
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;max-width:600px">
    <cngx-card>
      <header cngxCardHeader>
        <span style="font-size:0.8125rem;color:var(--text-muted)">Heart Rate</span>
      </header>
      <div cngxCardBody>
        <cngx-metric [value]="75" unit="bpm" />
      </div>
    </cngx-card>
    <cngx-card>
      <header cngxCardHeader>
        <span style="font-size:0.8125rem;color:var(--text-muted)">SpO2</span>
      </header>
      <div cngxCardBody>
        <cngx-metric [value]="96" unit="%" />
      </div>
    </cngx-card>
    <cngx-card>
      <header cngxCardHeader>
        <span style="font-size:0.8125rem;color:var(--text-muted)">BMI</span>
      </header>
      <div cngxCardBody>
        <cngx-metric value="n.b." />
      </div>
    </cngx-card>
  </div>`,
    },
  ],
};
