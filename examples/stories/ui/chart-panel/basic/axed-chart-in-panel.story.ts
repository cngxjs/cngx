import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChartPanel: Wide axis labels stay inside the card',
  subtitle:
    'A panel gives its body the full content width inside one padding rung, so a chart whose axis decoration hangs outside its own box paints over the card border. The chart reserves the room its axes need, which is why <code>1,200,000</code> lands inside the card without the panel touching its padding.',
  description:
    'The left axis formats thousands separators, so its widest tick is seven characters rather than the two a [0, 90] domain produces. That is the shape the defect needed: the overhang scales with the label, so a demo with short labels reads as fine while a real revenue axis does not. Nothing here configures the gutter - the chart derives which sides reserve from the axes you mounted and how much from the labels those axes already format.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition', 'layout'],
  apiComponents: ['CngxChartPanel', 'CngxChart', 'CngxAxis'],
  moduleImports: [
    "import { CngxChartPanel, CngxChartPanelTitle, CngxChartPanelSubtitle } from '@cngx/ui/chart-panel';",
    "import { CngxChart, CngxLine, CngxAxis } from '@cngx/common/chart';",
  ],
  imports: [
    'CngxChartPanel',
    'CngxChartPanelTitle',
    'CngxChartPanelSubtitle',
    'CngxChart',
    'CngxLine',
    'CngxAxis',
  ],
  setup: `protected readonly revenue: readonly number[] = [
    420000, 515000, 468000, 702000, 831000, 774000, 995000, 1180000,
  ];
  protected readonly thousands = (v: unknown): string => Number(v).toLocaleString('en-US');`,
  template: `<cngx-chart-panel style="max-width:520px">
    <h3 cngxChartPanelTitle>Net revenue</h3>
    <span cngxChartPanelSubtitle>EUR, by month</span>

    <cngx-chart [data]="revenue" [height]="200" aria-label="Net revenue in euro by month">
      <svg:g
        cngxAxis
        position="left"
        type="linear"
        [domain]="[0, 1200000]"
        [format]="thousands"
        [grid]="true"
      ></svg:g>
      <svg:g cngxAxis position="bottom" type="linear" [domain]="[1, 8]" [ticks]="8"></svg:g>
      <svg:g cngxLine [data]="revenue"></svg:g>
    </cngx-chart>
  </cngx-chart-panel>`,
};
