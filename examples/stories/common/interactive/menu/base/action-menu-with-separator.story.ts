import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMenu: action menu with separator',
  subtitle:
    'Arrow keys, typeahead (type the first letters), Home/End, Enter/Space. Disabled items and separators are skipped by navigation.',
  description:
    'Static <code>role="menu"</code> with <code>cngxMenuItem</code> children. Activation fires <code>itemActivated</code> with the item value; the menu carries no selection state. <code>cngxMenuSeparator</code> renders <code>role="separator"</code> and is skipped by arrow-key navigation and typeahead.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern', 'visual-variants'],
  references: [
    {
      label: 'WAI-ARIA APG: Menu and Menubar Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menubar/',
    },
    {
      label: 'WCAG 2.1.1 Keyboard',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
    },
  ],
  apiComponents: [
    'CngxMenu',
    'CngxMenuItem',
    'CngxMenuSeparator',
    'CngxMenuItemIcon',
    'CngxMenuItemLabel',
    'CngxMenuItemKbd',
  ],
  moduleImports: [
    "import { CngxMenu, CngxMenuItem, CngxMenuSeparator, CngxMenuItemIcon, CngxMenuItemLabel, CngxMenuItemKbd } from '@cngx/common/interactive';",
  ],
  imports: [
    'CngxMenu',
    'CngxMenuItem',
    'CngxMenuSeparator',
    'CngxMenuItemIcon',
    'CngxMenuItemLabel',
    'CngxMenuItemKbd',
  ],
  setup: `protected readonly lastAction = signal<string | null>(null);`,
  template: `  <ul
    cngxMenu
    [label]="'File actions'"
    tabindex="0"
    (itemActivated)="lastAction.set($any($event))"
  >
    <li cngxMenuItem value="new">
      <span cngxMenuItemIcon>N</span>
      <span cngxMenuItemLabel>New</span>
      <kbd cngxMenuItemKbd>Ctrl+N</kbd>
    </li>
    <li cngxMenuItem value="open">
      <span cngxMenuItemIcon>O</span>
      <span cngxMenuItemLabel>Open...</span>
      <kbd cngxMenuItemKbd>Ctrl+O</kbd>
    </li>
    <li cngxMenuSeparator></li>
    <li cngxMenuItem value="save">
      <span cngxMenuItemIcon>S</span>
      <span cngxMenuItemLabel>Save</span>
      <kbd cngxMenuItemKbd>Ctrl+S</kbd>
    </li>
    <li cngxMenuItem value="save-as" [disabled]="true">
      <span cngxMenuItemIcon>A</span>
      <span cngxMenuItemLabel>Save as... (disabled)</span>
      <kbd cngxMenuItemKbd>Ctrl+Shift+S</kbd>
    </li>
    <li cngxMenuSeparator></li>
    <li cngxMenuItem value="close">
      <span cngxMenuItemIcon>X</span>
      <span cngxMenuItemLabel>Close</span>
      <kbd cngxMenuItemKbd>Ctrl+W</kbd>
    </li>
  </ul>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Last action</span>
      <span class="event-value">{{ lastAction() ?? '-' }}</span>
    </div>
  </div>`,
};
