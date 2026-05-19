import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Sizes',
  subtitle: 'Five size presets driven by CSS custom properties. Default font size is 1.25em; override via <code>--cngx-icon-size</code>.',
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
  <div class="icon-row">
    <cngx-icon size="xs">★</cngx-icon>
    <cngx-icon size="sm">★</cngx-icon>
    <cngx-icon size="md">★</cngx-icon>
    <cngx-icon size="lg">★</cngx-icon>
    <cngx-icon size="xl">★</cngx-icon>
  </div>`,
  css: `.icon-row {
  display: flex;
  align-items: baseline;
  gap: 16px;
  color: var(--cngx-accent, #4a8cff);
}`,
};
