import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSliderTrack: Headless custom skin',
  subtitle:
    'The headless <code>[cngxSliderTrack]</code> directive: put it on your own element and bring your own track / fill / thumb markup.',
  description:
    'When the finished <code>&lt;cngx-slider&gt;</code> skin is not what you want, the directive gives you the full <code>role="slider"</code> brain - keyboard, pointer-drag, ARIA - and publishes <code>--cngx-slider-fraction</code> so your own markup positions the thumb. Default Track-B styling ships in <code>@cngx/themes/cngx.css</code>.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxSliderTrack'],
  imports: ['CngxSliderTrack'],
  references: [
    {
      label: 'WAI-ARIA APG: Slider pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/slider/',
    },
  ],
  setup: `protected readonly level = signal(30);`,
  template: `  <div style="max-width:320px">
    <label id="lvl-label" style="display:block;margin-bottom:12px;font-weight:600">Level</label>
    <div cngxSliderTrack class="cngx-slider" aria-labelledby="lvl-label" [(value)]="level" [min]="0" [max]="100">
      <span class="cngx-slider__track"><span class="cngx-slider__fill"></span></span>
      <span class="cngx-slider__thumb"></span>
    </div>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:16px">
    <span class="event-label">value</span>
    <span class="event-value">{{ level() }}</span>
  </div>`,
};
