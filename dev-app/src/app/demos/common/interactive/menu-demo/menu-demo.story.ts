import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Menu',
  navLabel: 'Menu',
  navCategory: 'interactive',
  description:
    'Keyboard-navigable menu with role="menu" and cngxMenuItem children. Activation fires itemActivated; no selection state. Supports separators (skipped by AD nav) and inline static menu rendering.',
  apiComponents: ['CngxMenu', 'CngxMenuItem', 'CngxMenuSeparator'],
  overview:
    '<p><code>[cngxMenu]</code> composes <code>CngxActiveDescendant</code> and role="menu". ' +
    'Arrow keys navigate, Home/End jump to boundaries, typeahead jumps to matching labels, ' +
    'Enter/Space/click activate. Disabled items are skipped.</p>' +
    '<p><code>[cngxMenuSeparator]</code> renders <code>role="separator"</code>; ' +
    'Active-descendant navigation skips it automatically.</p>',
  moduleImports: [
    "import { CngxMenu, CngxMenuItem, CngxMenuSeparator } from '@cngx/common/interactive';",
  ],
  setup: `
  protected readonly lastAction = signal<string | null>(null);
  `,
  sections: [
    {
      title: 'Action menu with separator',
      subtitle:
        'Use arrow keys, typeahead (type the first letters of an action), Home/End, Enter/Space. Disabled items and separators are skipped.',
      imports: ['CngxMenu', 'CngxMenuItem', 'CngxMenuSeparator'],
      template: `
  <ul
    cngxMenu
    [label]="'File actions'"
    class="menu"
    tabindex="0"
    (itemActivated)="lastAction.set($any($event))"
  >
    <li cngxMenuItem value="new">New</li>
    <li cngxMenuItem value="open">Open…</li>
    <li cngxMenuSeparator></li>
    <li cngxMenuItem value="save">Save</li>
    <li cngxMenuItem value="save-as" [disabled]="true">Save as… (disabled)</li>
    <li cngxMenuSeparator></li>
    <li cngxMenuItem value="close">Close</li>
  </ul>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Last action</span>
      <span class="event-value">{{ lastAction() ?? '—' }}</span>
    </div>
  </div>`,
      css: `.menu {
  list-style: none;
  margin: 0;
  padding: 4px;
  width: 240px;
  border: 1px solid var(--cngx-surface-border, #d0d5dd);
  border-radius: var(--cngx-radius-md, 8px);
  background: var(--cngx-surface-default, #fff);
  outline: none;
}
.menu:focus-visible {
  outline: 2px solid var(--cngx-focus-ring, #4a8cff);
  outline-offset: 2px;
}
.menu [cngxMenuItem] {
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
}
.cngx-menu-item--highlighted {
  background: var(--cngx-menu-highlight-bg, rgba(74, 140, 255, 0.15));
}
.cngx-menu-item--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
[cngxMenuSeparator] {
  display: block;
  height: 1px;
  margin: 4px 6px;
  background: var(--cngx-surface-border, #e5e7eb);
  list-style: none;
}`,
    },
  ],
};
