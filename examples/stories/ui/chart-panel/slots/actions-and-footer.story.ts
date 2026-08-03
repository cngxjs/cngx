import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChartPanel: Actions and footer',
  subtitle:
    'All four chrome slots at once: title, subtitle, a header action cluster and a footer note. The panel supplies layout and the accessible name; every piece of content is yours.',
  description:
    'The action cluster is a plain projected slot - the library ships no button, so a consumer brings their own design system. While a panel-level operation runs the cluster goes aria-disabled with pointer events off, deliberately not inert: inert would remove the cluster from the accessibility tree and the aria-disabled would never be announced.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxChartPanel'],
  moduleImports: [
    "import { CngxChartPanel, CngxChartPanelTitle, CngxChartPanelSubtitle, CngxChartPanelActions, CngxChartPanelFooter } from '@cngx/ui/chart-panel';",
    "import { CngxChart, CngxLine, CngxAxis, CngxAxisDomain } from '@cngx/common/chart';",
    "import { CngxTag } from '@cngx/common/display';",
  ],
  imports: [
    'CngxChartPanel',
    'CngxChartPanelTitle',
    'CngxChartPanelSubtitle',
    'CngxChartPanelActions',
    'CngxChartPanelFooter',
    'CngxChart',
    'CngxLine',
    'CngxAxis',
    'CngxAxisDomain',
    'CngxTag',
  ],
  setup: `protected readonly series: readonly number[] = [42, 51, 47, 63, 58, 71, 69, 82];`,
  template: `<cngx-chart-panel style="max-width:520px">
    <h3 cngxChartPanelTitle>Revenue by quarter</h3>
    <span cngxChartPanelSubtitle>EUR, net</span>

    <div cngxChartPanelActions>
      <button type="button" class="chip">Range</button>
      <button type="button" class="chip">Export</button>
    </div>

    <cngx-chart [data]="series" [height]="180" aria-label="Net revenue by quarter">
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 90]" [grid]="true"></svg:g>
      <svg:g
        cngxAxisDomain
        position="bottom"
        type="linear"
        [domain]="[0, 7]"
      ></svg:g>
      <svg:g cngxLine [data]="series"></svg:g>
    </cngx-chart>

    <div cngxChartPanelFooter>
      <cngx-tag>finance warehouse</cngx-tag>
      <span>synced 5 minutes ago</span>
    </div>
  </cngx-chart-panel>`,
};
