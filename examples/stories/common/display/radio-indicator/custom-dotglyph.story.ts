import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRadioIndicator: Custom dotGlyph',
  subtitle: 'Project a <code>TemplateRef&lt;void&gt;</code> via <code>[dotGlyph]</code> to replace the default dot with a brand glyph or SVG. Glyph still gates on <code>checked</code>.',
  description: 'Two indicators share the same <code>#starGlyph</code> template. The first has <code>[checked]="true"</code> so the star renders inside the circle; the second is unchecked, so the consumer-supplied glyph is not projected at all (the slot is gated on <code>checked()</code> in the directive). The custom template is always wrapped in <code>aria-hidden="true"</code> by the host, so brand glyphs never leak into the assistive-tech tree.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: [
    'CngxRadioIndicator',
  ],
  moduleImports: [
    'import { CngxRadioIndicator } from \'@cngx/common/display\';',
  ],
  imports: ['CngxRadioIndicator'],
  template: `
  <ng-template #starGlyph>
    <span aria-hidden="true" style="font-size:0.6em">★</span>
  </ng-template>
  <div class="demo-radio-row">
    <div class="demo-radio-cell">
      <cngx-radio-indicator [checked]="true" [dotGlyph]="starGlyph" />
      <span class="demo-radio-caption">custom star</span>
    </div>
    <div class="demo-radio-cell">
      <cngx-radio-indicator [dotGlyph]="starGlyph" />
      <span class="demo-radio-caption">unchecked, glyph hidden</span>
    </div>
  </div>`,
};
