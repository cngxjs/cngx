import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Default glyphs (internal)',
  subtitle: 'Every glyph cngx draws itself, rendered from <code>@cngx/utils</code> path data by <code>svg[cngxIconSvg]</code>. Internal sign-off surface, not a public icon set.',
  description: 'Each row shows the glyph standalone at the running text size and projected into <code>&lt;cngx-icon size="lg"&gt;</code>, which then owns the box. Fill glyphs paint their area in <code>currentColor</code>; stroke glyphs paint only the outline with round caps. Check the shapes in light, dark and forced colors.',
  audience: ['design'],
  focus: ['visual-variants'],
  apiComponents: ['CngxIconSvg'],
  moduleImports: [
    'import { CngxIcon, CngxIconSvg } from \'@cngx/common/display\';',
    'import { CNGX_ICON_ALERT, CNGX_ICON_BAN, CNGX_ICON_CARET_DOWN, CNGX_ICON_CHECK, CNGX_ICON_CHEVRONS_LEFT, CNGX_ICON_CHEVRONS_RIGHT, CNGX_ICON_CHEVRON_LEFT, CNGX_ICON_CHEVRON_RIGHT, CNGX_ICON_DOT, CNGX_ICON_GRIP_VERTICAL, CNGX_ICON_MORE_HORIZONTAL, CNGX_ICON_PLUS, CNGX_ICON_TRIANGLE_DOWN, CNGX_ICON_TRIANGLE_UP, CNGX_ICON_X } from \'@cngx/utils\';',
  ],
  imports: ['CngxIcon', 'CngxIconSvg'],
  setup: `
  protected readonly icons = [
    { name: 'CNGX_ICON_X', icon: CNGX_ICON_X },
    { name: 'CNGX_ICON_PLUS', icon: CNGX_ICON_PLUS },
    { name: 'CNGX_ICON_CARET_DOWN', icon: CNGX_ICON_CARET_DOWN },
    { name: 'CNGX_ICON_CHEVRON_LEFT', icon: CNGX_ICON_CHEVRON_LEFT },
    { name: 'CNGX_ICON_CHEVRON_RIGHT', icon: CNGX_ICON_CHEVRON_RIGHT },
    { name: 'CNGX_ICON_CHEVRONS_LEFT', icon: CNGX_ICON_CHEVRONS_LEFT },
    { name: 'CNGX_ICON_CHEVRONS_RIGHT', icon: CNGX_ICON_CHEVRONS_RIGHT },
    { name: 'CNGX_ICON_MORE_HORIZONTAL', icon: CNGX_ICON_MORE_HORIZONTAL },
    { name: 'CNGX_ICON_CHECK', icon: CNGX_ICON_CHECK },
    { name: 'CNGX_ICON_DOT', icon: CNGX_ICON_DOT },
    { name: 'CNGX_ICON_ALERT', icon: CNGX_ICON_ALERT },
    { name: 'CNGX_ICON_BAN', icon: CNGX_ICON_BAN },
    { name: 'CNGX_ICON_GRIP_VERTICAL', icon: CNGX_ICON_GRIP_VERTICAL },
    { name: 'CNGX_ICON_TRIANGLE_UP', icon: CNGX_ICON_TRIANGLE_UP },
    { name: 'CNGX_ICON_TRIANGLE_DOWN', icon: CNGX_ICON_TRIANGLE_DOWN },
  ] as const;`,
  template: `
  <div style="display:grid; grid-template-columns:auto auto 1fr auto; align-items:center; gap:8px 24px">
    @for (entry of icons; track entry.name) {
      <svg [cngxIconSvg]="entry.icon"></svg>
      <cngx-icon size="lg"><svg [cngxIconSvg]="entry.icon"></svg></cngx-icon>
      <code>{{ entry.name }}</code>
      <span>{{ entry.icon.paint }}</span>
    }
  </div>`,
};
