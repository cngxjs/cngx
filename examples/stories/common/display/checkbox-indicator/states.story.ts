import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCheckboxIndicator: States',
  subtitle: 'Four boolean states (<code>checked</code>, <code>indeterminate</code>, <code>disabled</code>, none) crossed against both <code>variant</code> values. The atom owns visuals only; the parent row owns selection truth.',
  description: 'A 2x4 grid that maps the four input combinations to their rendered output. The top row uses <code>variant="checkbox"</code> (bordered box around the glyph), the bottom row uses <code>variant="checkmark"</code> (bare glyph). <code>indeterminate</code> takes precedence over <code>checked</code> when both are true. <code>disabled</code> dims the indicator but never blocks interaction, because the indicator does not handle interaction in the first place.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'behavior'],
  apiComponents: [
    'CngxCheckboxIndicator',
  ],
  moduleImports: [
    'import { CngxCheckboxIndicator } from \'@cngx/common/display\';',
  ],
  imports: ['CngxCheckboxIndicator'],
  template: `
  <div style="display:grid; grid-template-columns: 7rem repeat(4, 6rem); gap:12px; align-items:center">
    <span></span>
    <code>unchecked</code>
    <code>checked</code>
    <code>indeterminate</code>
    <code>disabled</code>

    <code>checkbox</code>
    <cngx-checkbox-indicator variant="checkbox" />
    <cngx-checkbox-indicator variant="checkbox" [checked]="true" />
    <cngx-checkbox-indicator variant="checkbox" [indeterminate]="true" />
    <cngx-checkbox-indicator variant="checkbox" [checked]="true" [disabled]="true" />

    <code>checkmark</code>
    <cngx-checkbox-indicator variant="checkmark" />
    <cngx-checkbox-indicator variant="checkmark" [checked]="true" />
    <cngx-checkbox-indicator variant="checkmark" [indeterminate]="true" />
    <cngx-checkbox-indicator variant="checkmark" [checked]="true" [disabled]="true" />
  </div>`,
};
