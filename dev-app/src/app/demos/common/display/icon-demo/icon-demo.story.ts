import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Icon',
  navLabel: 'Icon',
  navCategory: 'display',
  description:
    'Display atom for icons. Projects its content (font glyph, SVG, image) and adds ARIA semantics and sizing.',
  apiComponents: ['CngxIcon'],
  overview:
    '<p><code>cngx-icon</code> is decorative by default (<code>aria-hidden="true"</code>) and becomes informative when <code>label</code> is set (<code>role="img"</code>, <code>aria-label</code>). No icon registry — bring your own font or SVG.</p>',
  moduleImports: ["import { CngxIcon } from '@cngx/common/display';"],
  sections: [
    {
      title: 'Sizes',
      subtitle:
        'Five size presets driven by CSS custom properties. Default font size is 1.25em; override via <code>--cngx-icon-size</code>.',
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
    },
    {
      title: 'Decorative vs informative',
      subtitle:
        'The top icon is decorative (hidden from AT). The bottom icon has <code>label</code>, so it is announced.',
      imports: ['CngxIcon'],
      template: `
  <div style="display:flex;flex-direction:column;gap:8px">
    <span>Status: <cngx-icon>✓</cngx-icon> Saved</span>
    <span>Status: <cngx-icon label="Saved">✓</cngx-icon> <span aria-hidden="true">Saved</span></span>
  </div>`,
    },
  ],
};
