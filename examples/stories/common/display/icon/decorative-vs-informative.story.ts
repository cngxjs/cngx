import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxIcon: Decorative vs informative',
  subtitle: 'The top icon is decorative (hidden from AT). The bottom icon has <code>label</code>, so it is announced.',
  description: 'Two status lines contrast the two a11y modes. The first uses <code>&lt;cngx-icon&gt;</code> without a <code>label</code>, so the directive sets <code>aria-hidden="true"</code> and the icon glyph is skipped by assistive tech, so the visible word "Saved" carries the meaning. The second sets <code>label="Saved"</code>, which flips the host to <code>role="img"</code> with an <code>aria-label</code>, so the icon itself is announced as "Saved"; the trailing visual text is wrapped in <code>aria-hidden="true"</code> so the announcement is not duplicated.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: [
    'CngxIcon',
  ],
  moduleImports: [
    'import { CngxIcon } from \'@cngx/common/display\';',
  ],
  imports: ['CngxIcon'],
  references: [
    { label: 'WAI-ARIA 1.2: `img` role', href: 'https://www.w3.org/TR/wai-aria-1.2/#img' },
    { label: 'WAI-ARIA 1.2: `aria-hidden`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-hidden' },
    { label: 'WAI-ARIA 1.2: `aria-label`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-label' },
  ],
  template: `
  <div style="display:flex; flex-direction:column; gap:8px">
    <span>Status: <cngx-icon>✓</cngx-icon> Saved</span>
    <span>Status: <cngx-icon label="Saved">✓</cngx-icon>&nbsp;<span aria-hidden="true">Saved</span></span>
  </div>`,
};
