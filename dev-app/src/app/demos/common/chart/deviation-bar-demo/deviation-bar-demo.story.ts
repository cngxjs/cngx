import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Deviation Bar',
  navLabel: 'Deviation Bar',
  navCategory: 'chart',
  description:
    'Single-value indicator that diverges from a baseline (default 0). Negative deviations render to the left; positive to the right.',
  apiComponents: ['CngxDeviationBar'],
  moduleImports: [
    "import { CngxDeviationBar } from '@cngx/common/chart';",
  ],
  sections: [
    {
      title: 'Variance readings',
      subtitle: 'Budget variance, score deltas, KPI swings — symmetric around the baseline mark.',
      imports: ['CngxDeviationBar'],
      template: `
  <div style="display:flex;flex-direction:column;gap:12px;max-width:360px">
    <div style="display:flex;align-items:center;gap:12px">
      <span style="flex:1">Q1 budget</span>
      <cngx-deviation-bar [value]="45" [magnitude]="100" aria-label="Q1 budget +45" />
      <span style="font-weight:600;color:var(--success,#1f9d55);width:60px;text-align:right">+$45k</span>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <span style="flex:1">Q2 budget</span>
      <cngx-deviation-bar [value]="-30" [magnitude]="100" aria-label="Q2 budget -30" />
      <span style="font-weight:600;color:var(--danger,#d2452f);width:60px;text-align:right">−$30k</span>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <span style="flex:1">Q3 budget</span>
      <cngx-deviation-bar [value]="0" [magnitude]="100" aria-label="Q3 budget on target" />
      <span style="font-weight:600;width:60px;text-align:right">on target</span>
    </div>
  </div>`,
    },
  ],
};
