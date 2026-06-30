import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSlider: Keyboard, steps, and value label',
  subtitle:
    'A stepped <code>&lt;cngx-slider&gt;</code> with <code>[valueText]</code> and <code>showValue</code> - the formatted percent shows above the thumb and is announced to screen readers.',
  description:
    'Arrow keys move by one <code>step</code>; Page keys jump a tenth of the range; Home / End snap to the bounds. <code>[valueText]</code> feeds both the visible <code>showValue</code> label and <code>aria-valuetext</code>, so sighted and screen-reader users hear "60 percent" alike.',
  level: 'molecule',
  audience: ['a11y', 'dev'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxSlider'],
  imports: ['CngxSlider'],
  references: [
    {
      label: 'WAI-ARIA APG: Slider keyboard interaction',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/slider/#keyboardinteraction',
    },
  ],
  setup: `protected readonly brightness = signal(60);
  protected readonly asPercent = (value: number): string => \`\${value} percent\`;`,
  templateChromeBefore: `<p style="margin:0 0 16px;color:var(--cngx-color-text-muted,#666)">
    Tab to the slider, then press Arrow keys (step 5), Page keys (jump 10), or Home / End.
  </p>`,
  template: `  <div style="max-width:320px;padding-top:24px">
    <label id="bright-label" style="display:block;margin-bottom:12px;font-weight:600">Brightness</label>
    <cngx-slider
      aria-labelledby="bright-label"
      [(value)]="brightness"
      [min]="0"
      [max]="100"
      [step]="5"
      [valueText]="asPercent"
      showValue />
  </div>`,
};
