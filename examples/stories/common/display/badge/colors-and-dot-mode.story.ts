import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBadge: Colors and dot mode',
  subtitle: 'Boolean <code>true</code> flips to dot mode (no text).',
  description: 'Four button hosts demonstrate <code>[cngxBadge]</code> with a numeric value plus an explicit <code>color</code> variant (<code>error</code>, <code>warning</code>, <code>neutral</code>), and the boolean <code>true</code> shortcut that flips the indicator into dot mode. The indicator span is always <code>aria-hidden="true"</code>; semantic meaning lives on the host. The dot button therefore carries an explicit <code>aria-label</code>, because color and dot shape alone are not a sufficient accessible name (WCAG 1.4.1).',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: [
    'CngxBadge',
  ],
  moduleImports: [
    'import { CngxBadge } from \'@cngx/common/display\';',
  ],
  imports: ['CngxBadge'],
  references: [
    { label: 'WCAG 2.1 SC 1.4.1 Use of Color', href: 'https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html' },
    { label: 'WAI-ARIA 1.2: `aria-label`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-label' },
    { label: 'WAI-ARIA 1.2: `aria-hidden`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-hidden' },
  ],
  template: `
  <div style="display:flex; gap:14px; align-items:center; flex-wrap:wrap">
    <button type="button" class="chip" [cngxBadge]="1" color="error">Errors</button>
    <button type="button" class="chip" [cngxBadge]="5" color="warning">Warnings</button>
    <button type="button" class="chip" [cngxBadge]="2" color="neutral">Drafts</button>
    <button type="button" class="chip" [cngxBadge]="true" color="error" aria-label="new notifications">Live</button>
  </div>`,
};
