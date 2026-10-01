import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRadioIndicator: Disabled',
  subtitle: 'Cosmetic only: ring and dot fade by colour, the 38% text recipe of a disabled field. The atom never intercepts events; the parent row owns the disabled hit-test.',
  description: 'Two indicators show the disabled visual treatment paired with checked and unchecked state. Setting <code>[disabled]="true"</code> toggles the host class <code>.cngx-radio-indicator--disabled</code>, which paints the circle and dot in the disabled colour (GrayText under forced colors). The indicator still does not intercept pointer events: keyboard focus and click handling remain the responsibility of the surrounding row.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxRadioIndicator',
  ],
  moduleImports: [
    'import { CngxRadioIndicator } from \'@cngx/common/display\';',
  ],
  imports: ['CngxRadioIndicator'],
  template: `
  <div class="demo-radio-row">
    <div class="demo-radio-cell">
      <cngx-radio-indicator [checked]="true" [disabled]="true" />
      <span class="demo-radio-caption">checked + disabled</span>
    </div>
    <div class="demo-radio-cell">
      <cngx-radio-indicator [disabled]="true" />
      <span class="demo-radio-caption">unchecked + disabled</span>
    </div>
  </div>`,
};
