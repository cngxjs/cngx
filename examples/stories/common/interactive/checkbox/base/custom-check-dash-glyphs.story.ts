import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Custom check + dash glyphs',
  subtitle: '<code>cngx-checkbox</code> forwards <code>[checkGlyph]</code> and <code>[dashGlyph]</code> to the inner <code>cngx-checkbox-indicator</code>. Project a <code>TemplateRef&lt;void&gt;</code> each to replace the default ✓ / − glyphs with brand or design-system icons.',
  description: 'Single-value boolean checkbox atom with WAI-ARIA tristate semantics. Composes <code>cngx-checkbox-indicator</code> from @cngx/common/display for the visual state. Click on an indeterminate checkbox advances to <code>value=true, indeterminate=false</code> in a single step — there is no path that lands the checkbox back in <code>mixed</code> from a user click.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxCheckbox',
  ],
  moduleImports: [
    'import { CngxCheckbox } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxCheckbox'],
  template: `
  <ng-template #brandedCheck><span aria-hidden="true">★</span></ng-template>
  <ng-template #brandedDash><span aria-hidden="true">~</span></ng-template>
  <cngx-checkbox [value]="true" [checkGlyph]="brandedCheck">Custom check</cngx-checkbox>
  <cngx-checkbox
    [value]="false"
    [indeterminate]="true"
    [dashGlyph]="brandedDash"
  >Custom dash</cngx-checkbox>`,
  css: `cngx-checkbox { display: inline-flex; margin-right: 24px; }`,
};
