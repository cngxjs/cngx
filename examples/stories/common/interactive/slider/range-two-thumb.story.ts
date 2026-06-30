import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRangeSlider: Two-thumb range',
  subtitle:
    'The finished <code>&lt;cngx-range-slider&gt;</code>: two thumbs with an orange fill band between them; they cannot cross.',
  description:
    'Bind <code>[(value)]</code> to a <code>[number, number]</code> tuple. The component renders the track, the fill band, and both draggable handles, and clamps each thumb to the other so they never pass. <code>showValue</code> floats the current min/max above the thumbs.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: ['CngxRangeSlider'],
  imports: ['CngxRangeSlider'],
  references: [
    {
      label: 'WAI-ARIA APG: Slider (Multi-Thumb) pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/',
    },
  ],
  setup: `protected readonly price = signal<[number, number]>([200, 800]);`,
  template: `  <div style="max-width:320px;padding-top:24px">
    <label id="price-label" style="display:block;margin-bottom:12px;font-weight:600">Price range</label>
    <cngx-range-slider
      aria-labelledby="price-label"
      [(value)]="price"
      [min]="0"
      [max]="1000"
      [step]="10"
      startLabel="Minimum price"
      endLabel="Maximum price"
      showValue />
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:16px">
    <div class="event-row"><span class="event-label">min</span><span class="event-value">{{ price()[0] }}</span></div>
    <div class="event-row"><span class="event-label">max</span><span class="event-value">{{ price()[1] }}</span></div>
  </div>`,
};
