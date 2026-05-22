import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRadioIndicator: Sizes',
  subtitle: 'Three presets driven by <code>--cngx-radio-indicator-size</code>. Defaults to <code>md</code> (1em).',
  description: 'Three checked indicators baseline-aligned in a flex row, one per <code>size</code> preset (<code>sm</code> / <code>md</code> / <code>lg</code>). Each preset toggles a host class that points the indicator size token at a different scale step, so the atom matches the size scale of its sibling <code>CngxCheckboxIndicator</code> inside a select panel without per-instance overrides.',
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
  <div class="demo-radio-row demo-radio-row--baseline">
    <div class="demo-radio-cell">
      <cngx-radio-indicator [checked]="true" size="sm" />
      <span class="demo-radio-caption">sm (0.875em)</span>
    </div>
    <div class="demo-radio-cell">
      <cngx-radio-indicator [checked]="true" size="md" />
      <span class="demo-radio-caption">md (1em)</span>
    </div>
    <div class="demo-radio-cell">
      <cngx-radio-indicator [checked]="true" size="lg" />
      <span class="demo-radio-caption">lg (1.25em)</span>
    </div>
  </div>`,
};
