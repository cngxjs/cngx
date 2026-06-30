import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSlider: Single-thumb basic',
  subtitle:
    'A headless <code>[cngxSlider]</code> with the default skin: drag the thumb or use the arrow keys; <code>aria-valuenow</code> tracks the value.',
  description:
    'The directive owns <code>role="slider"</code> and the full value ARIA surface; it publishes the thumb position as the inherited <code>--cngx-slider-fraction</code> custom property, which the track / fill / thumb read. The value is a <code>model&lt;number&gt;</code>, so it binds two-way with <code>[(value)]</code>.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: ['CngxSlider'],
  imports: ['CngxSlider'],
  references: [
    {
      label: 'WAI-ARIA APG: Slider pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/slider/',
    },
    {
      label: 'WCAG 2.1 SC 4.1.2 Name, Role, Value',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
    },
  ],
  setup: `protected readonly volume = signal(40);`,
  template: `  <div style="max-width:320px">
    <label id="vol-label" style="display:block;margin-bottom:12px;font-weight:600">Volume</label>
    <div
      cngxSlider
      class="cngx-slider"
      aria-labelledby="vol-label"
      [(value)]="volume"
      [min]="0"
      [max]="100">
      <span class="cngx-slider__track"><span class="cngx-slider__fill"></span></span>
      <span class="cngx-slider__thumb"></span>
    </div>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:16px">
    <span class="event-label">value</span>
    <span class="event-value">{{ volume() }}</span>
  </div>`,
};
