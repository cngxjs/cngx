import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSlider: Vertical and tick marks',
  subtitle:
    '<code>orientation="vertical"</code> rotates the whole skin; <code>showTicks</code> paints a mark every <code>step</code>.',
  description:
    'The brain measures the pointer bottom-up and emits <code>aria-orientation="vertical"</code>; the skin anchors the fill and thumb to the lower edge. A vertical slider needs an explicit length via <code>--cngx-slider-length</code>.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'behavior'],
  apiComponents: ['CngxSlider'],
  imports: ['CngxSlider'],
  references: [
    {
      label: 'WAI-ARIA APG: Slider pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/slider/',
    },
  ],
  setup: `protected readonly gain = signal(60);
  protected readonly level = signal(40);`,
  template: `  <div style="display:flex;gap:72px;align-items:flex-start;padding:16px 8px 40px">
    <div style="display:flex;flex-direction:column;gap:16px;align-items:center;padding:0 3.75rem">
      <label id="gain-label" style="font-weight:600">Gain</label>
      <cngx-slider
        aria-labelledby="gain-label"
        orientation="vertical"
        [(value)]="gain"
        [min]="0"
        [max]="100"
        [step]="10"
        showValue
        showTicks
        showTickLabels />
    </div>
    <div style="flex:1;max-width:280px;padding-block:8px 28px">
      <label id="level-label" style="display:block;margin-bottom:16px;font-weight:600">Level (ticked)</label>
      <cngx-slider
        aria-labelledby="level-label"
        [(value)]="level"
        [min]="0"
        [max]="100"
        [step]="10"
        showTicks
        showTickLabels />
    </div>
  </div>`,
};
