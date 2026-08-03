import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChart: Point-marker modes',
  subtitle:
    'The <code>[points]</code> input takes <code>auto</code> (default), <code>always</code>, and <code>never</code>. Same six-reading series, three modes side by side.',
  description:
    '<code>always</code> marks every datum - useful for a sparse series where the reader should see each sample. <code>auto</code> marks only a single-datum series and so shows a bare line here. <code>never</code> suppresses markers entirely. Marker radius is the <code>--cngx-line-point-radius</code> token, so the mode is behaviour and the size is theming.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['visual-variants', 'behavior'],
  apiComponents: ['CngxChart', 'CngxAxis', 'CngxLine'],
  references: [
    {
      label: 'WCAG 1.1.1 Non-text Content',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
    },
  ],
  moduleImports: ["import { CngxChart, CngxAxis, CngxLine } from '@cngx/common/chart';"],
  imports: ['CngxChart', 'CngxAxis', 'CngxLine'],
  setup: `protected readonly readings: readonly number[] = [6, 11, 8, 14, 10, 16];`,
  template: `  <div style="display:flex;flex-direction:column;gap:20px;max-width:520px">
    <div>
      <div class="cngx-ex-status-readout" style="margin-bottom:4px">points="always" - a marker on every datum</div>
      <div class="cngx-ex-chart-frame">
        <cngx-chart [data]="readings" [width]="480" [height]="140" aria-label="Six readings with a marker on every point.">
          <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 5]" [ticks]="6"></svg:g>
          <svg:g cngxAxis position="left" type="linear" [domain]="[0, 20]" [grid]="true"></svg:g>
          <svg:g cngxLine [strokeWidth]="2" points="always"></svg:g>
        </cngx-chart>
      </div>
    </div>
    <div>
      <div class="cngx-ex-status-readout" style="margin-bottom:4px">points="auto" (default) - no markers on a multi-point series</div>
      <div class="cngx-ex-chart-frame">
        <cngx-chart [data]="readings" [width]="480" [height]="140" aria-label="Six readings, no markers in auto mode.">
          <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 5]" [ticks]="6"></svg:g>
          <svg:g cngxAxis position="left" type="linear" [domain]="[0, 20]" [grid]="true"></svg:g>
          <svg:g cngxLine [strokeWidth]="2" points="auto"></svg:g>
        </cngx-chart>
      </div>
    </div>
    <div>
      <div class="cngx-ex-status-readout" style="margin-bottom:4px">points="never" - markers suppressed</div>
      <div class="cngx-ex-chart-frame">
        <cngx-chart [data]="readings" [width]="480" [height]="140" aria-label="Six readings, markers suppressed.">
          <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 5]" [ticks]="6"></svg:g>
          <svg:g cngxAxis position="left" type="linear" [domain]="[0, 20]" [grid]="true"></svg:g>
          <svg:g cngxLine [strokeWidth]="2" points="never"></svg:g>
        </cngx-chart>
      </div>
    </div>
  </div>`,
};
