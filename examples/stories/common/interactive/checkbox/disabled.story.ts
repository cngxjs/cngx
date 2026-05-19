import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Disabled',
  subtitle: 'Disabled checkboxes ignore click + keydown and reflect <code>aria-disabled="true"</code>.',
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
  <cngx-checkbox [value]="true" [disabled]="true">Locked-on</cngx-checkbox>
  <cngx-checkbox [value]="false" [disabled]="true">Locked-off</cngx-checkbox>
  <cngx-checkbox [value]="false" [indeterminate]="true" [disabled]="true">Locked-mixed</cngx-checkbox>`,
  css: `cngx-checkbox { display: inline-flex; margin-right: 24px; }`,
};
