import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDeviationBar: Variance readings',
  subtitle:
    'Budget variance, score deltas, and KPI swings render symmetrically around the baseline. Positive deviations extend right, negative deviations extend left; the magnitude bound sets the symmetry.',
  description:
    'Three labelled rows feed the same bar with positive, negative, and zero deviations. The bar takes its sign-and-magnitude routing from <code>[value]</code> alone; <code>[magnitude]</code> sets the symmetric upper bound. Surrounding numeric labels stay separate, so the demo composes a small KPI strip without coupling the bar to its label.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxDeviationBar'],
  moduleImports: ["import { CngxDeviationBar } from '@cngx/common/chart';"],
  imports: ['CngxDeviationBar'],
  setup: `protected readonly variance: ReadonlyArray<{ label: string; value: number; display: string }> = [
    { label: 'Q1 budget', value: 45, display: '+$45k' },
    { label: 'Q2 budget', value: -30, display: '-$30k' },
    { label: 'Q3 budget', value: 0, display: 'on target' },
  ];`,
  template: `  <ul class="cngx-ex-kpi-strip">
    @for (row of variance; track row.label) {
      <li>
        <span>{{ row.label }}</span>
        <cngx-deviation-bar [value]="row.value" [magnitude]="100" [attr.aria-label]="row.label + ' ' + row.display" />
        <span>{{ row.display }}</span>
      </li>
    }
  </ul>`,
};
