import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Inside a Card',
  subtitle: 'Metric as the primary value inside a card body — composable with any card archetype.',
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
    'import { CngxCard, CngxCardHeader, CngxCardBody } from \'@cngx/common/card\';',
  ],
  imports: ['CngxMetric', 'CngxCard', 'CngxCardHeader', 'CngxCardBody'],
  template: `
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;max-width:600px">
    <cngx-card>
      <header cngxCardHeader>
        <span style="font-size:0.8125rem;color:var(--cngx-color-text-muted)">Heart Rate</span>
      </header>
      <div cngxCardBody>
        <cngx-metric [value]="75" unit="bpm" />
      </div>
    </cngx-card>
    <cngx-card>
      <header cngxCardHeader>
        <span style="font-size:0.8125rem;color:var(--cngx-color-text-muted)">SpO2</span>
      </header>
      <div cngxCardBody>
        <cngx-metric [value]="96" unit="%" />
      </div>
    </cngx-card>
    <cngx-card>
      <header cngxCardHeader>
        <span style="font-size:0.8125rem;color:var(--cngx-color-text-muted)">BMI</span>
      </header>
      <div cngxCardBody>
        <cngx-metric value="n.b." />
      </div>
    </cngx-card>
  </div>`,
};
