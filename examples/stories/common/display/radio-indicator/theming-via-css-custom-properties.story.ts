import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRadioIndicator: Theming via CSS custom properties',
  subtitle: 'Override <code>--cngx-radio-indicator-checked-color</code>, <code>--cngx-radio-indicator-border-width</code>, <code>--cngx-radio-indicator-dot-size</code>, and friends per consumer.',
  description: 'Three checked <code>lg</code> indicators sit next to each other. The first inherits the default skin from the cngx theme layer. The second is a brand-magenta variant that re-points <code>--cngx-radio-indicator-checked-color</code> and bumps <code>--cngx-radio-indicator-border-width</code> via a consumer-supplied class. The third is a brand-emerald variant that overrides the checked color and the dot size. No directive output, no DI wiring: every override is a pure CSS custom property the consumer drops on a class or inline.',
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
  <div class="demo-radio-row" style="font-size:1.75em">
    <cngx-radio-indicator [checked]="true" size="lg" />
    <cngx-radio-indicator [checked]="true" size="lg" class="demo-radio-brand-magenta" />
    <cngx-radio-indicator [checked]="true" size="lg" class="demo-radio-brand-emerald" />
  </div>`,
};
