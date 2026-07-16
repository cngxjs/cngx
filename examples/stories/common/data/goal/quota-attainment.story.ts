import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxGoal: Quota attainment',
  subtitle:
    'A determinate attainment bar toward a target. <code>role="progressbar"</code> with the full <code>aria-value*</code> set; the <code>valueTextFormat</code> closure spells the value out for a screen reader.',
  description:
    'The value is clamped to [0, max] and the fill width derives from the clamped percent. A screen reader announces "73 of 100, 73% of quota" via aria-valuetext. Distinct from the discrete CngxSegmentedProgress and the indeterminate cngx-progress loading bar.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'visual-variants'],
  apiComponents: ['CngxGoal'],
  moduleImports: ["import { CngxGoal } from '@cngx/common/data';"],
  imports: ['CngxGoal'],
  setup: `protected readonly quotaText = (now: number, max: number): string =>
    \`\${now} of \${max}, \${Math.round((now / max) * 100)}% of quota\`;`,
  template: `<div style="max-width:320px;display:flex;flex-direction:column;gap:8px">
    <span class="demo-card-label">Quarterly quota</span>
    <cngx-goal [value]="73" [max]="100" [valueTextFormat]="quotaText" />
  </div>`,
};
