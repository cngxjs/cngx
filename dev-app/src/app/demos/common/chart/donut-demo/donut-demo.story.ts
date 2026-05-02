import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Donut',
  navLabel: 'Donut',
  navCategory: 'chart',
  description:
    'Circular gauge for a single bounded value. Host carries role="meter"; the optional [label] renders inside the ring.',
  apiComponents: ['CngxDonut'],
  moduleImports: [
    "import { CngxDonut } from '@cngx/common/chart';",
  ],
  sections: [
    {
      title: 'Score gauges',
      subtitle: 'Three sizes; theming via --cngx-donut-color → --cngx-chart-primary.',
      imports: ['CngxDonut'],
      template: `
  <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
    <cngx-donut [value]="75" [max]="100" [size]="48" [thickness]="6" [label]="'75%'" aria-label="Score 75 of 100" />
    <cngx-donut [value]="42" [max]="100" [size]="64" [thickness]="8" [label]="'42%'"
      style="--cngx-donut-color: var(--accent-secondary, #7d8997)" aria-label="Coverage 42 of 100" />
    <cngx-donut [value]="98" [max]="100" [size]="80" [thickness]="10" [label]="'A+'"
      style="--cngx-donut-color: var(--success, #1f9d55)" aria-label="Quality A plus" />
    <cngx-donut [value]="12" [max]="100" [size]="64" [thickness]="8" [label]="'12%'"
      style="--cngx-donut-color: var(--danger, #d2452f)" aria-label="Critical 12 of 100" />
  </div>`,
    },
  ],
};
