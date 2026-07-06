import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRangeSliderTrack: Headless range custom skin',
  subtitle:
    'The headless range path: <code>[cngxRangeSliderTrack]</code> on your own element with two <code>[cngxSliderThumb]</code> children.',
  description:
    'When the finished <code>&lt;cngx-range-slider&gt;</code> skin is not what you want, the directive gives you the dual-thumb brain - tuple value, cross-clamp, per-thumb keyboard/ARIA - and you own the markup. Each thumb publishes <code>--cngx-slider-fraction</code>; the host publishes <code>--cngx-slider-start/end-fraction</code> for the fill band. Default Track-B styling ships in <code>@cngx/themes/cngx.css</code>.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxRangeSliderTrack', 'CngxSliderThumb'],
  imports: ['CngxRangeSliderTrack', 'CngxSliderThumb'],
  references: [
    {
      label: 'WAI-ARIA APG: Slider (Multi-Thumb) pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/',
    },
  ],
  setup: `protected readonly price = signal<[number, number]>([200, 800]);`,
  template: `  <div style="max-width:320px">
    <label id="price-label" style="display:block;margin-bottom:12px;font-weight:600">Price range</label>
    <div
      cngxRangeSliderTrack
      class="cngx-slider"
      role="group"
      aria-labelledby="price-label"
      [(value)]="price"
      [min]="0"
      [max]="1000"
      [step]="10">
      <span class="cngx-slider__track"></span>
      <span cngxSliderThumb="start" aria-label="Minimum price"></span>
      <span cngxSliderThumb="end" aria-label="Maximum price"></span>
    </div>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:16px">
    <div class="event-row"><span class="event-label">min</span><span class="event-value">{{ price()[0] }}</span></div>
    <div class="event-row"><span class="event-label">max</span><span class="event-value">{{ price()[1] }}</span></div>
  </div>`,
};
