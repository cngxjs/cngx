import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Menu',
  navLabel: 'Menu',
  navCategory: 'interactive',
  description:
    'Keyboard-navigable menu with role="menu" and cngxMenuItem children. Activation fires itemActivated; no selection state. Supports separators (skipped by AD nav) and inline static menu rendering.',
  apiComponents: [
    'CngxMenu',
    'CngxMenuItem',
    'CngxMenuSeparator',
    'CngxMenuItemIcon',
    'CngxMenuItemLabel',
    'CngxMenuItemSuffix',
    'CngxMenuItemKbd',
  ],
  overview:
    '<p><code>[cngxMenu]</code> composes <code>CngxActiveDescendant</code> and role="menu". ' +
    'Arrow keys navigate, Home/End jump to boundaries, typeahead jumps to matching labels, ' +
    'Enter/Space/click activate. Disabled items are skipped.</p>' +
    '<p><code>[cngxMenuSeparator]</code> renders <code>role="separator"</code>; ' +
    'Active-descendant navigation skips it automatically.</p>' +
    '<p>Marker-directive slots — <code>[cngxMenuItemIcon]</code>, ' +
    '<code>[cngxMenuItemLabel]</code>, <code>[cngxMenuItemSuffix]</code>, ' +
    '<code>[cngxMenuItemKbd]</code> — apply BEM class names ' +
    '(<code>cngx-menu-item__icon</code> etc.) to consumer-owned elements ' +
    'inside each <code>[cngxMenuItem]</code>. Pure presentational hooks; ' +
    'no inputs, no behaviour. Style each position via the BEM selector.</p>',
  moduleImports: [
    "import { CngxMenu, CngxMenuItem, CngxMenuSeparator, CngxMenuItemIcon, CngxMenuItemLabel, CngxMenuItemKbd } from '@cngx/common/interactive';",
  ],
  setup: `
  protected readonly lastAction = signal<string | null>(null);
  `,
  sections: [
    {
      title: 'Action menu with separator',
      subtitle:
        'Use arrow keys, typeahead (type the first letters of an action), Home/End, Enter/Space. Disabled items and separators are skipped.',
      imports: [
        'CngxMenu',
        'CngxMenuItem',
        'CngxMenuSeparator',
        'CngxMenuItemIcon',
        'CngxMenuItemLabel',
        'CngxMenuItemKbd',
      ],
      template: `
  <ul
    cngxMenu
    [label]="'File actions'"
    class="menu"
    tabindex="0"
    (itemActivated)="lastAction.set($any($event))"
  >
    <li cngxMenuItem value="new">
      <span cngxMenuItemIcon>📄</span>
      <span cngxMenuItemLabel>New</span>
      <kbd cngxMenuItemKbd>⌘N</kbd>
    </li>
    <li cngxMenuItem value="open">
      <span cngxMenuItemIcon>📂</span>
      <span cngxMenuItemLabel>Open…</span>
      <kbd cngxMenuItemKbd>⌘O</kbd>
    </li>
    <li cngxMenuSeparator></li>
    <li cngxMenuItem value="save">
      <span cngxMenuItemIcon>💾</span>
      <span cngxMenuItemLabel>Save</span>
      <kbd cngxMenuItemKbd>⌘S</kbd>
    </li>
    <li cngxMenuItem value="save-as" [disabled]="true">
      <span cngxMenuItemIcon>📝</span>
      <span cngxMenuItemLabel>Save as… (disabled)</span>
      <kbd cngxMenuItemKbd>⇧⌘S</kbd>
    </li>
    <li cngxMenuSeparator></li>
    <li cngxMenuItem value="close">
      <span cngxMenuItemIcon>✕</span>
      <span cngxMenuItemLabel>Close</span>
      <kbd cngxMenuItemKbd>⌘W</kbd>
    </li>
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
  width: 280px;
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
  display: flex;
  align-items: center;
  gap: 8px;
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
.cngx-menu-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  font-size: 1rem;
  line-height: 1;
}
.cngx-menu-item__label {
  flex: 1;
  min-width: 0;
}
.cngx-menu-item__kbd {
  margin-left: auto;
  padding: 1px 6px;
  font-family: var(--cngx-font-mono, ui-monospace, monospace);
  font-size: 0.75rem;
  color: var(--cngx-text-muted, #64748b);
  border: 1px solid var(--cngx-surface-border, #d0d5dd);
  border-radius: 4px;
  background: var(--cngx-surface-muted, #f9fafb);
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
