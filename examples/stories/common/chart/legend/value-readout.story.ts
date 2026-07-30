import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChartLegend: Value readout',
  subtitle:
    'A legend beside a <code>CngxStackedBar</code> carries the exact per-series count in its <code>value</code> field, turning the swatch list into a readout.',
  description:
    'Each item passes <code>{ label, color, value }</code>; the <code>value</code> renders in a <code>.cngx-chart-legend__value</code> node after the label. <code>--cngx-chart-legend-value-font-weight</code> weights the count apart from the label, so the number reads as data without a wrapper element or a consumer-drawn table.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['composition'],
  apiComponents: ['CngxChartLegend', 'CngxStackedBar'],
  references: [
    {
      label: 'WCAG 1.1.1 Non-text Content',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
    },
  ],
  moduleImports: ["import { CngxChartLegend, CngxStackedBar } from '@cngx/common/chart';"],
  imports: ['CngxChartLegend', 'CngxStackedBar'],
  template: `  <div style="display:flex;flex-direction:column;gap:16px;max-width:360px">
    <cngx-stacked-bar
      aria-label="Incidents by severity: 42 critical, 31 warning, 68 info"
      [segments]="[
        { value: 42, color: '#d2452f', label: 'Critical' },
        { value: 31, color: '#e8913a', label: 'Warning' },
        { value: 68, color: '#4c8bf5', label: 'Info' }
      ]"
    />
    <cngx-chart-legend
      orientation="vertical"
      style="--cngx-chart-legend-value-font-weight: 700"
      [items]="[
        { label: 'Critical', color: '#d2452f', value: 42 },
        { label: 'Warning', color: '#e8913a', value: 31 },
        { label: 'Info', color: '#4c8bf5', value: 68 }
      ]"
    />
  </div>`,
};
