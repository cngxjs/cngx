import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Context Menu Trigger',
  navLabel: 'Context Menu',
  navCategory: 'interactive',
  description:
    'Right-click or Shift+F10 opens a CngxMenu inside a CngxPopover anchored at the pointer location. Escape closes; arrow keys navigate.',
  apiComponents: ['CngxContextMenuTrigger', 'CngxMenu', 'CngxMenuItem'],
  overview:
    '<p><code>[cngxContextMenuTrigger]</code> turns any focusable region into a context-menu host. ' +
    'Right-click (<code>contextmenu</code> event) opens the menu at the pointer; <kbd>Shift</kbd>+<kbd>F10</kbd> opens at the element center. ' +
    '<kbd>Escape</kbd> closes. Arrow keys / typeahead drive navigation through the underlying <code>CngxActiveDescendant</code>.</p>' +
    '<p>The popover anchor is a transient zero-size element positioned at the pointer; see ' +
    '<code>menu-accepted-debt.md §1</code> for the rationale.</p>',
  moduleImports: [
    "import { CngxContextMenuTrigger, CngxMenu, CngxMenuItem, CngxMenuSeparator } from '@cngx/common/interactive';",
    "import { CngxPopover } from '@cngx/common/popover';",
  ],
  setup: `
  protected readonly lastAction = signal<string | null>(null);
  `,
  sections: [
    {
      title: 'Right-click target zone',
      subtitle:
        'Right-click anywhere inside the dashed zone, or focus it and press Shift+F10. Escape closes the menu.',
      imports: [
        'CngxContextMenuTrigger',
        'CngxMenu',
        'CngxMenuItem',
        'CngxMenuSeparator',
        'CngxPopover',
      ],
      template: `
  <style>
    .zone { display: flex; align-items: center; justify-content: center; min-height: 160px; padding: 16px; border: 2px dashed #c7cdd6; border-radius: 8px; background: #f9fafb; color: #475569; cursor: context-menu; user-select: none; }
    .zone:focus-visible { outline: 2px solid #4a8cff; outline-offset: 2px; }
    .pop { padding: 4px; min-width: 200px; border: 1px solid #d0d5dd; border-radius: 6px; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .menu { list-style: none; margin: 0; padding: 0; outline: none; }
    .menu [cngxMenuItem] { padding: 6px 10px; border-radius: 4px; cursor: pointer; user-select: none; }
    .menu [cngxMenuItem]:hover, .menu .cngx-menu-item--highlighted { background: rgba(74, 140, 255, 0.15); }
    .menu [cngxMenuSeparator] { display: block; height: 1px; margin: 4px 6px; background: #e5e7eb; list-style: none; }
  </style>
  <div
    class="zone"
    tabindex="0"
    [cngxContextMenuTrigger]="ctx"
    [popover]="pop"
  >
    Right-click here (or focus + Shift+F10)
  </div>
  <div cngxPopover #pop="cngxPopover" placement="bottom-start" class="pop">
    <ul
      cngxMenu
      [label]="'Context actions'"
      class="menu"
      tabindex="0"
      #ctx="cngxMenu"
      (itemActivated)="lastAction.set($any($event)); pop.hide()"
    >
      <li cngxMenuItem value="cut">Cut</li>
      <li cngxMenuItem value="copy">Copy</li>
      <li cngxMenuItem value="paste">Paste</li>
      <li cngxMenuSeparator></li>
      <li cngxMenuItem value="delete">Delete</li>
    </ul>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Last action</span>
      <span class="event-value">{{ lastAction() ?? '—' }}</span>
    </div>
  </div>`,
      css: `.zone {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  padding: 16px;
  border: 2px dashed var(--cngx-surface-border, #c7cdd6);
  border-radius: var(--cngx-radius-md, 8px);
  background: var(--cngx-surface-muted, #f9fafb);
  color: var(--cngx-text-muted, #475569);
  cursor: context-menu;
  user-select: none;
}
.zone:focus-visible {
  outline: 2px solid var(--cngx-focus-ring, #4a8cff);
  outline-offset: 2px;
}
.pop {
  padding: 4px;
  min-width: 200px;
  border: 1px solid var(--cngx-surface-border, #d0d5dd);
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.menu {
  list-style: none;
  margin: 0;
  padding: 0;
  outline: none;
}
.menu [cngxMenuItem] {
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
}
.cngx-menu-item--highlighted {
  background: var(--cngx-menu-highlight-bg, rgba(74, 140, 255, 0.15));
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
