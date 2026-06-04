import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCheckbox: custom check + dash glyphs',
  subtitle:
    '<code>[checkGlyph]</code> and <code>[dashGlyph]</code> forward a <code>TemplateRef&lt;void&gt;</code> through to <code>cngx-checkbox-indicator</code>, so design-system icon sets replace the default <code>&check;</code>/<code>&minus;</code> without forking the atom.',
  description:
    'Shows the glyph-projection escape hatch. The custom templates sit inside the same <code>aria-hidden="true"</code> indicator subtree, so they remain decorative; the source of truth for "checked" is still <code>aria-checked</code> on the host. Spacing between siblings comes from the library token <code>--cngx-checkbox-sibling-gap</code>, not the demo.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'visual-variants'],
  references: [
    {
      label: 'WAI-ARIA APG: Checkbox Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/',
    },
    {
      label: 'WCAG 1.1.1 Non-text Content',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
    },
    {
      label: 'WCAG 4.1.2 Name, Role, Value',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
    },
  ],
  apiComponents: ['CngxCheckbox'],
  moduleImports: [
    "import { CngxCheckbox } from '@cngx/common/interactive';",
  ],
  imports: ['CngxCheckbox'],
  template: `
  <ng-template #brandedCheck><span aria-hidden="true">&#9733;</span></ng-template>
  <ng-template #brandedDash><span aria-hidden="true">~</span></ng-template>
  <cngx-checkbox [value]="true" [checkGlyph]="brandedCheck">Custom check</cngx-checkbox>
  <cngx-checkbox
    [value]="false"
    [indeterminate]="true"
    [dashGlyph]="brandedDash"
  >Custom dash</cngx-checkbox>`,
};
