import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRangeSlider: Two-thumb range',
  subtitle:
    'Two <code>[cngxSliderThumb]</code> children share one <code>[cngxRangeSlider]</code>; the thumbs cannot cross because each is clamped to the other.',
  description:
    'The range slider owns a <code>model&lt;[number, number]&gt;</code> tuple and provides <code>CNGX_SLIDER_RANGE</code>. Each thumb is its own focusable <code>role="slider"</code> with independent keyboard and ARIA, bounded by the sibling value - clamp math, not an effect.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: ['CngxRangeSlider', 'CngxSliderThumb'],
  imports: ['CngxRangeSlider', 'CngxSliderThumb'],
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
      cngxRangeSlider
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
