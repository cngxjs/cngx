import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChartPanel: Titled panel with legend',
  subtitle:
    'The panel frames a projected chart with a title, a subtitle and a legend. <code>role="group"</code> plus an <code>aria-labelledby</code> pointing at the projected title makes the whole region announce as "Revenue by quarter" instead of dropping the user into an unlabelled SVG.',
  description:
    'legendPosition moves a single projected cngx-chart-legend via CSS order - the slot matches the bare cngx-chart-legend tag, so a legend wrapped in an element of your own lands in the body instead. Switch the position to see the placement change without any DOM reordering that could desync from tab order.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxChartPanel'],
  moduleImports: [
    "import { CngxChartPanel, CngxChartPanelTitle, CngxChartPanelSubtitle } from '@cngx/ui/chart-panel';",
    "import { CngxChart, CngxLine, CngxAxis, CngxChartLegend } from '@cngx/common/chart';",
  ],
  imports: [
    'CngxChartPanel',
    'CngxChartPanelTitle',
    'CngxChartPanelSubtitle',
    'CngxChart',
    'CngxLine',
    'CngxAxis',
    'CngxChartLegend',
  ],
  setup: `protected readonly series: readonly number[] = [42, 51, 47, 63, 58, 71, 69, 82];`,
  setupChrome: `protected readonly legendPosition = signal<'top' | 'bottom' | 'none'>('bottom');`,
  template: `<cngx-chart-panel [legendPosition]="legendPosition()" style="max-width:520px">
    <h3 cngxChartPanelTitle>Revenue by quarter</h3>
    <span cngxChartPanelSubtitle>EUR, net</span>

    <cngx-chart [data]="series" [height]="180" aria-label="Net revenue by quarter">
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 90]" [grid]="true"></svg:g>
      <svg:g cngxLine [data]="series"></svg:g>
    </cngx-chart>

    <cngx-chart-legend [items]="[{ label: 'Net revenue' }]" />
  </cngx-chart-panel>`,
  templateChromeBefore: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="legendPosition.set('bottom')">legend: bottom</button>
    <button type="button" class="chip" (click)="legendPosition.set('top')">legend: top</button>
    <button type="button" class="chip" (click)="legendPosition.set('none')">legend: none</button>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px">
    <span class="cngx-ex-status-readout">legendPosition: {{ legendPosition() }}</span>
  </div>`,
};
