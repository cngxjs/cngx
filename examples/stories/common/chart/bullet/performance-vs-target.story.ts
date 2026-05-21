import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBullet: Performance vs target',
  subtitle:
    'Range bands (poor / fair / good) sit behind the actual filled bar; the vertical marker shows the target. Three quarters demonstrate below-target, at-target, and over-target visuals on the same configuration.',
  description:
    'Stephen Few\'s compact KPI visualisation: three stacked layers. Range bands provide the qualitative context, the actual bar paints the measured value, the target marker draws the threshold. All three layers share the chart\'s <code>[max]</code> so the bands and the bar use the same coordinate space.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxBullet'],
  references: [
    {
      label: 'WAI-ARIA: meter role',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#meter',
    },
    {
      label: 'WCAG 1.1.1 Non-text Content',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
    },
  ],
  moduleImports: ["import { CngxBullet } from '@cngx/common/chart';"],
  imports: ['CngxBullet'],
  setup: `protected readonly ranges = [
    { from: 0, to: 50, color: 'color-mix(in oklch, currentColor 10%, transparent)', label: 'poor' },
    { from: 50, to: 75, color: 'color-mix(in oklch, currentColor 18%, transparent)', label: 'fair' },
    { from: 75, to: 100, color: 'color-mix(in oklch, currentColor 28%, transparent)', label: 'good' },
  ];
  protected readonly quarters: ReadonlyArray<{ label: string; actual: number; tone?: string; aria: string }> = [
    { label: 'Q1 revenue', actual: 78, aria: 'Q1 revenue: 78 of 100, target 80' },
    { label: 'Q2 revenue', actual: 92, aria: 'Q2 revenue: 92 of 100, target 80, exceeded' },
    { label: 'Q3 revenue', actual: 35, tone: 'var(--cngx-color-danger, #d2452f)', aria: 'Q3 revenue: 35 of 100, target 80, below target' },
  ];`,
  template: `  <div style="display:flex;flex-direction:column;gap:16px;max-width:400px">
    @for (q of quarters; track q.label) {
      <div>
        <div class="cngx-ex-status-readout" style="margin-bottom:4px">{{ q.label }}</div>
        <cngx-bullet
          [actual]="q.actual"
          [target]="80"
          [max]="100"
          [ranges]="ranges"
          [style.--cngx-bullet-actual-color]="q.tone ?? null"
          [attr.aria-label]="q.aria"
        />
      </div>
    }
  </div>`,
};
