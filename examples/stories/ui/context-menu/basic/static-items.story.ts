import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxContextMenu: static items',
  subtitle:
    'The minimal case - right-click the zone (or focus it and press Shift+F10) to open a fixed menu. Two template elements, one binding: <code>[cngxContextMenuFor]</code> on the target and a sibling <code>&lt;cngx-context-menu&gt;</code>.',
  description:
    'Items are projected statically - no content template, no per-open datum. Each <code>cngx-context-menu-item</code> is a thin shell over <code>CngxMenuItem</code>, so <code>role="menuitem"</code>, active-descendant navigation and Enter/Space activation all come from the brain. The keyboard-shortcut hints render through the <code>kbd</code> slot.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Menu Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu/',
    },
    {
      label: 'WCAG 2.1.1 Keyboard',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
    },
  ],
  apiComponents: ['CngxContextMenu', 'CngxContextMenuFor', 'CngxContextMenuItem', 'CngxContextMenuDivider'],
  moduleImports: [
    "import { CngxContextMenu, CngxContextMenuDivider, CngxContextMenuFor, CngxContextMenuItem } from '@cngx/ui/context-menu';",
  ],
  imports: ['CngxContextMenu', 'CngxContextMenuDivider', 'CngxContextMenuFor', 'CngxContextMenuItem'],
  setup: `protected readonly lastAction = signal<string | null>(null);

protected act(action: string): void {
  this.lastAction.set(action);
}`,
  template: `  <div
    class="demo-ctx-zone"
    tabindex="0"
    [cngxContextMenuFor]="menu"
    style="display:grid;place-items:center;min-block-size:140px;padding:24px;border:1px dashed var(--cngx-color-border, oklch(0.88 0.005 250));border-radius:8px;cursor:context-menu"
  >
    Right-click here (or focus and press Shift+F10)
  </div>

  <cngx-context-menu ariaLabel="Clipboard actions" #menu="cngxContextMenu">
    <cngx-context-menu-item value="copy" kbd="⌘C" (select)="act('Copy'); menu.popover.hide()">
      Copy
    </cngx-context-menu-item>
    <cngx-context-menu-item value="cut" kbd="⌘X" (select)="act('Cut'); menu.popover.hide()">
      Cut
    </cngx-context-menu-item>
    <cngx-context-menu-item value="paste" kbd="⌘V" (select)="act('Paste'); menu.popover.hide()">
      Paste
    </cngx-context-menu-item>
    <cngx-context-menu-divider />
    <cngx-context-menu-item value="delete" (select)="act('Delete'); menu.popover.hide()">
      Delete
    </cngx-context-menu-item>
  </cngx-context-menu>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Last action</span>
      <span class="event-value">{{ lastAction() ?? '-' }}</span>
    </div>
  </div>`,
};
