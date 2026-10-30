import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Default glyphs (internal)',
  subtitle: 'Every glyph cngx draws itself, rendered from <code>@cngx/utils</code> path data by <code>svg[cngxIconSvg]</code>. Internal sign-off surface, not a public icon set.',
  description: 'Each row shows the glyph standalone at the running text size (1em) and projected into <code>&lt;cngx-icon&gt;</code> at every size preset (<code>xs</code> to <code>xl</code>), which then owns the box. Fill glyphs paint their area in <code>currentColor</code>; stroke glyphs paint only the outline with round caps. Check the shapes in light, dark and forced colors.',
  audience: ['design'],
  focus: ['visual-variants'],
  apiComponents: ['CngxIconSvg'],
  moduleImports: [
    'import { CngxIcon, CngxIconSvg } from \'@cngx/common/display\';',
    'import { CNGX_ICON_ALERT, CNGX_ICON_BAN, CNGX_ICON_CARET_DOWN, CNGX_ICON_CHECK, CNGX_ICON_CHEVRONS_LEFT, CNGX_ICON_CHEVRONS_RIGHT, CNGX_ICON_CHEVRON_LEFT, CNGX_ICON_CHEVRON_RIGHT, CNGX_ICON_DOT, CNGX_ICON_GRIP_VERTICAL, CNGX_ICON_MINUS, CNGX_ICON_MORE_HORIZONTAL, CNGX_ICON_MORE_VERTICAL, CNGX_ICON_PLUS, CNGX_ICON_TRIANGLE_DOWN, CNGX_ICON_TRIANGLE_UP, CNGX_ICON_X, CNGX_ICON_CHEVRON_DOWN, CNGX_ICON_TRASH, CNGX_ICON_DOWNLOAD, CNGX_ICON_X_CIRCLE, CNGX_ICON_CUT, CNGX_ICON_COPY, CNGX_ICON_CLIPBOARD, CNGX_ICON_SEARCH, CNGX_ICON_ZOOM_IN, CNGX_ICON_ZOOM_OUT, CNGX_ICON_MAXIMIZE, CNGX_ICON_UNDO, CNGX_ICON_REDO, CNGX_ICON_PENCIL, CNGX_ICON_BELL, CNGX_ICON_INFO, CNGX_ICON_EXCLAMATION, CNGX_ICON_EXCLAMATION_SOLID, CNGX_ICON_QUESTION, CNGX_ICON_INFO_CIRCLE, CNGX_ICON_CHECK_CIRCLE, CNGX_ICON_ARCHIVE, CNGX_ICON_VOLUME, CNGX_ICON_STOP } from \'@cngx/utils\';',
  ],
  imports: ['CngxIcon', 'CngxIconSvg'],
  setup: `
  protected readonly sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

  protected readonly icons = [
    { name: 'CNGX_ICON_X', icon: CNGX_ICON_X },
    { name: 'CNGX_ICON_PLUS', icon: CNGX_ICON_PLUS },
    { name: 'CNGX_ICON_MINUS', icon: CNGX_ICON_MINUS },
    { name: 'CNGX_ICON_CARET_DOWN', icon: CNGX_ICON_CARET_DOWN },
    { name: 'CNGX_ICON_CHEVRON_LEFT', icon: CNGX_ICON_CHEVRON_LEFT },
    { name: 'CNGX_ICON_CHEVRON_RIGHT', icon: CNGX_ICON_CHEVRON_RIGHT },
    { name: 'CNGX_ICON_CHEVRONS_LEFT', icon: CNGX_ICON_CHEVRONS_LEFT },
    { name: 'CNGX_ICON_CHEVRONS_RIGHT', icon: CNGX_ICON_CHEVRONS_RIGHT },
    { name: 'CNGX_ICON_MORE_HORIZONTAL', icon: CNGX_ICON_MORE_HORIZONTAL },
    { name: 'CNGX_ICON_MORE_VERTICAL', icon: CNGX_ICON_MORE_VERTICAL },
    { name: 'CNGX_ICON_CHECK', icon: CNGX_ICON_CHECK },
    { name: 'CNGX_ICON_DOT', icon: CNGX_ICON_DOT },
    { name: 'CNGX_ICON_ALERT', icon: CNGX_ICON_ALERT },
    { name: 'CNGX_ICON_BAN', icon: CNGX_ICON_BAN },
    { name: 'CNGX_ICON_GRIP_VERTICAL', icon: CNGX_ICON_GRIP_VERTICAL },
    { name: 'CNGX_ICON_TRIANGLE_UP', icon: CNGX_ICON_TRIANGLE_UP },
    { name: 'CNGX_ICON_TRIANGLE_DOWN', icon: CNGX_ICON_TRIANGLE_DOWN },
    { name: 'CNGX_ICON_CHEVRON_DOWN', icon: CNGX_ICON_CHEVRON_DOWN },
    { name: 'CNGX_ICON_TRASH', icon: CNGX_ICON_TRASH },
    { name: 'CNGX_ICON_DOWNLOAD', icon: CNGX_ICON_DOWNLOAD },
    { name: 'CNGX_ICON_X_CIRCLE', icon: CNGX_ICON_X_CIRCLE },
    { name: 'CNGX_ICON_CUT', icon: CNGX_ICON_CUT },
    { name: 'CNGX_ICON_COPY', icon: CNGX_ICON_COPY },
    { name: 'CNGX_ICON_CLIPBOARD', icon: CNGX_ICON_CLIPBOARD },
    { name: 'CNGX_ICON_SEARCH', icon: CNGX_ICON_SEARCH },
    { name: 'CNGX_ICON_ZOOM_IN', icon: CNGX_ICON_ZOOM_IN },
    { name: 'CNGX_ICON_ZOOM_OUT', icon: CNGX_ICON_ZOOM_OUT },
    { name: 'CNGX_ICON_MAXIMIZE', icon: CNGX_ICON_MAXIMIZE },
    { name: 'CNGX_ICON_UNDO', icon: CNGX_ICON_UNDO },
    { name: 'CNGX_ICON_REDO', icon: CNGX_ICON_REDO },
    { name: 'CNGX_ICON_PENCIL', icon: CNGX_ICON_PENCIL },
    { name: 'CNGX_ICON_BELL', icon: CNGX_ICON_BELL },
    { name: 'CNGX_ICON_INFO', icon: CNGX_ICON_INFO },
    { name: 'CNGX_ICON_EXCLAMATION', icon: CNGX_ICON_EXCLAMATION },
    { name: 'CNGX_ICON_EXCLAMATION_SOLID', icon: CNGX_ICON_EXCLAMATION_SOLID },
    { name: 'CNGX_ICON_QUESTION', icon: CNGX_ICON_QUESTION },
    { name: 'CNGX_ICON_INFO_CIRCLE', icon: CNGX_ICON_INFO_CIRCLE },
    { name: 'CNGX_ICON_CHECK_CIRCLE', icon: CNGX_ICON_CHECK_CIRCLE },
    { name: 'CNGX_ICON_ARCHIVE', icon: CNGX_ICON_ARCHIVE },
    { name: 'CNGX_ICON_VOLUME', icon: CNGX_ICON_VOLUME },
    { name: 'CNGX_ICON_STOP', icon: CNGX_ICON_STOP },
  ] as const;`,
  template: `
  <div style="display:grid; grid-template-columns:repeat(6, auto) 1fr auto; align-items:center; justify-items:center; gap:8px 24px">
    <span>1em</span>
    @for (size of sizes; track size) {
      <span>{{ size }}</span>
    }
    <span style="justify-self:start">name</span>
    <span>paint</span>
    @for (entry of icons; track entry.name) {
      <svg [cngxIconSvg]="entry.icon"></svg>
      @for (size of sizes; track size) {
        <cngx-icon [size]="size"><svg [cngxIconSvg]="entry.icon"></svg></cngx-icon>
      }
      <code style="justify-self:start">{{ entry.name }}</code>
      <span>{{ entry.icon.paint }}</span>
    }
  </div>`,
};
