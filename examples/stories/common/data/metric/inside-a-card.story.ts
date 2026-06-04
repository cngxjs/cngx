import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMetric: Inside a card',
  subtitle: 'Metric as the primary value inside a card body; composable with any card archetype.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxMetric'],
  moduleImports: [
    "import { CngxMetric } from '@cngx/common/data';",
    "import { CngxCard, CngxCardHeader, CngxCardBody } from '@cngx/common/card';",
  ],
  imports: ['CngxMetric', 'CngxCard', 'CngxCardHeader', 'CngxCardBody'],
  template: `<cngx-card style="max-width:240px">
    <header cngxCardHeader>
      <span class="demo-card-label">Heart Rate</span>
    </header>
    <div cngxCardBody>
      <cngx-metric [value]="75" unit="bpm" />
    </div>
  </cngx-card>`,
  templateChrome: `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;max-width:600px;margin-top:24px">
    <cngx-card>
      <header cngxCardHeader>
        <span class="demo-card-label">SpO2 (percent)</span>
      </header>
      <div cngxCardBody>
        <cngx-metric [value]="96" unit="%" />
      </div>
    </cngx-card>
    <cngx-card>
      <header cngxCardHeader>
        <span class="demo-card-label">BMI (string fallback)</span>
      </header>
      <div cngxCardBody>
        <cngx-metric value="n.b." />
      </div>
    </cngx-card>
  </div>`,
};
