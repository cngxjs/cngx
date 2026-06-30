import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSlider: Single-thumb basic',
  subtitle:
    'The finished <code>&lt;cngx-slider&gt;</code> component: bind <code>[(value)]</code> and it renders the track, fill, and thumb for you.',
  description:
    'No skin markup to write - the component renders track / fill / thumb and wires the full APG keyboard and pointer-drag through its <code>CngxSliderTrack</code> brain. The value is a <code>model&lt;number&gt;</code>, so it binds two-way and works with Signal Forms via <code>[control]</code>.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: ['CngxSlider'],
  imports: ['CngxSlider'],
  references: [
    {
      label: 'WAI-ARIA APG: Slider pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/slider/',
    },
  ],
  setup: `protected readonly volume = signal(40);`,
  template: `  <div style="max-width:320px">
    <label id="vol-label" style="display:block;margin-bottom:12px;font-weight:600">Volume</label>
    <cngx-slider aria-labelledby="vol-label" [(value)]="volume" [min]="0" [max]="100" />
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:16px">
    <span class="event-label">value</span>
    <span class="event-value">{{ volume() }}</span>
  </div>`,
};
