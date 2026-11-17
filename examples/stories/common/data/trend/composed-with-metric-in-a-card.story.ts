import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTrend: Composed with CngxMetric in a card',
  subtitle: 'Trend and Metric combine inside any card markup; no pre-built molecule needed. Each card uses [label] to give screen readers the comparison context the bare percentage lacks.',
  description: 'CngxTrend slots into a plain card header next to a label, CngxMetric fills the body below it. The composition is the molecule: no KPI-card wrapper, no options object, the consumer controls the layout. The Revenue card overrides [label] so the screen reader hears the comparison period, not just the raw percentage.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition', 'a11y-pattern'],
  references: [
    { label: 'WCAG 2.1: 1.1.1 Non-text Content', href: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html' },
  ],
  apiComponents: [
    'CngxTrend',
    'CngxMetric',
  ],
  moduleImports: [
    'import { CngxTrend, CngxMetric } from \'@cngx/common/data\';',
  ],
  imports: ['CngxTrend', 'CngxMetric'],
  template: `
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;max-width:660px">
    <article class="demo-card-tile" style="display:grid;gap:8px;padding:12px 16px">
      <header style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <span class="demo-card-label">Revenue</span>
        <cngx-trend [value]="12.5" label="+12.5% vs. last quarter" />
      </header>
      <div>
        <cngx-metric [value]="48200" unit="EUR" [format]="{ maximumFractionDigits: 0 }" />
      </div>
    </article>
    <article class="demo-card-tile" style="display:grid;gap:8px;padding:12px 16px">
      <header style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <span class="demo-card-label">Care Hours</span>
        <cngx-trend [value]="-3.2" />
      </header>
      <div>
        <cngx-metric [value]="156.5" unit="h" [format]="{ maximumFractionDigits: 1 }" />
      </div>
    </article>
    <article class="demo-card-tile" style="display:grid;gap:8px;padding:12px 16px">
      <header style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <span class="demo-card-label">Residents</span>
        <cngx-trend [value]="0" />
      </header>
      <div>
        <cngx-metric [value]="42" />
      </div>
    </article>
  </div>`,
  templateChrome: `<div style="margin-top:16px;display:flex;flex-direction:column;gap:8px">
    <span class="demo-metric-label">Screen-reader readout per card:</span>
    <dl class="demo-sr-transcript">
      <dt>Revenue <span class="demo-sr-tag demo-sr-tag--accent">overridden</span></dt>
      <dd>&ldquo;+12.5% vs. last quarter&rdquo;</dd>
      <dt>Care Hours <span class="demo-sr-tag">auto</span></dt>
      <dd>&ldquo;-3.2&nbsp;% down&rdquo;</dd>
      <dt>Residents <span class="demo-sr-tag">auto</span></dt>
      <dd>&ldquo;0.0&nbsp;% unchanged&rdquo;</dd>
    </dl>
  </div>`,
};
