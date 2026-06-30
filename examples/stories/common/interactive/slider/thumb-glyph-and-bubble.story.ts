import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSlider: Thumb glyph and value bubble',
  subtitle:
    '<code>[thumbGlyph]</code> projects your own content into the handle; <code>showValueBubble</code> floats the value as a pill only while focused or dragged.',
  description:
    'The thumb is a slot - pass any <code>ng-template</code> and it renders inside the handle. <code>showValueBubble</code> is the discrete (Material-style) value indicator: hidden at rest, shown on focus/drag - distinct from the always-on <code>showValue</code> label.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxSlider'],
  imports: ['CngxSlider'],
  references: [
    {
      label: 'WAI-ARIA APG: Slider pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/slider/',
    },
  ],
  setup: `protected readonly volume = signal(50);`,
  templateChromeBefore: `<p style="margin:0 0 16px;color:var(--cngx-color-text-muted,#666)">
    Focus or drag the thumb - the value bubble appears above the custom handle.
  </p>`,
  template: `  <ng-template #grip>
    <span style="font-size:9px;line-height:1;color:var(--cngx-color-on-primary,#fff)">||</span>
  </ng-template>
  <div style="max-width:320px;padding-top:32px">
    <label id="vol-label" style="display:block;margin-bottom:12px;font-weight:600">Volume</label>
    <cngx-slider
      aria-labelledby="vol-label"
      [(value)]="volume"
      [min]="0"
      [max]="100"
      [step]="5"
      [thumbGlyph]="grip"
      showValueBubble />
  </div>`,
};
