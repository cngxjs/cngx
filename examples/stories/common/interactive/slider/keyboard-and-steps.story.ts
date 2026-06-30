import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSlider: Keyboard and steps',
  subtitle:
    'A stepped slider with a custom <code>aria-valuetext</code> formatter. Focus it, then use Arrow, Page, Home, and End.',
  description:
    'Arrow keys move by one <code>step</code>; Page keys jump by the larger of one step and a tenth of the range; Home / End snap to the bounds. <code>[valueText]</code> formats <code>aria-valuetext</code> so screen readers announce "60 percent" instead of "60".',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
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
  template: `  <div style="max-width:320px">
    <label id="bright-label" style="display:block;margin-bottom:12px;font-weight:600">Brightness</label>
    <div
      cngxSlider
      class="cngx-slider"
      aria-labelledby="bright-label"
      [(value)]="brightness"
      [min]="0"
      [max]="100"
      [step]="5"
      [valueText]="asPercent">
      <span class="cngx-slider__track"><span class="cngx-slider__fill"></span></span>
      <span class="cngx-slider__thumb"></span>
    </div>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:16px">
    <span class="event-label">value</span>
    <span class="event-value">{{ brightness() }}</span>
  </div>`,
};
