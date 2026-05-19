import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Decorative vs informative',
  subtitle: 'The top icon is decorative (hidden from AT). The bottom icon has <code>label</code>, so it is announced.',
  description: 'Display atom for icons. Projects its content (font glyph, SVG, image) and adds ARIA semantics and sizing.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxIcon',
  ],
  moduleImports: [
    'import { CngxIcon } from \'@cngx/common/display\';',
  ],
  imports: ['CngxIcon'],
  template: `
  <div style="display:flex;flex-direction:column;gap:8px">
    <span>Status: <cngx-icon>✓</cngx-icon> Saved</span>
    <span>Status: <cngx-icon label="Saved">✓</cngx-icon> <span aria-hidden="true">Saved</span></span>
  </div>`,
};
