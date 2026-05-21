import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDonut: Score gauges',
  subtitle:
    'Three sizes share the same value-and-label contract; theming runs through <code>--cngx-donut-color</code> with a final fallback to <code>--cngx-chart-primary</code>.',
  description:
    'Four gauges with different size, thickness, label, and accent. Each donut renders independently; per-instance theming flows from inline custom properties (<code>--cngx-donut-color</code>) without forcing a wrapping container or theme variant.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxDonut'],
  moduleImports: ["import { CngxDonut } from '@cngx/common/chart';"],
  imports: ['CngxDonut'],
  template: `  <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
    <cngx-donut [value]="75" [max]="100" [size]="48" [thickness]="6" [label]="'75%'" aria-label="Score 75 of 100" />
    <cngx-donut [value]="42" [max]="100" [size]="64" [thickness]="8" [label]="'42%'"
      style="--cngx-donut-color: var(--cngx-color-text-muted, #7d8997)" aria-label="Coverage 42 of 100" />
    <cngx-donut [value]="98" [max]="100" [size]="80" [thickness]="10" [label]="'A+'"
      style="--cngx-donut-color: var(--cngx-color-success, #1f9d55)" aria-label="Quality A plus" />
    <cngx-donut [value]="12" [max]="100" [size]="64" [thickness]="8" [label]="'12%'"
      style="--cngx-donut-color: var(--cngx-color-danger, #d2452f)" aria-label="Critical 12 of 100" />
  </div>`,
};
