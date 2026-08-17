import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxContextMenu: nested submenu',
  subtitle:
    'A sibling declaration, not inline nesting. The "Export as" item binds <code>[submenu]</code> to a second <code>&lt;cngx-context-menu&gt;</code>; ArrowRight opens it and moves focus in, ArrowLeft returns, and the parent stays open the whole time.',
  description:
    'The item carries <code>CngxMenuItemSubmenu</code> as a host directive, wired internally through <code>CNGX_MENU_SUBMENU_WIRING</code> - no <code>[exclusive]</code> handgrip, no popover plumbing. The nested panel opens non-exclusively (parent survives) and the keyboard contract (ArrowRight / ArrowLeft / Escape) is shared with <code>CngxMenuTrigger</code> through the extracted focus stack.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Menu Pattern (submenus)',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu/',
    },
  ],
  apiComponents: ['CngxContextMenu', 'CngxContextMenuFor', 'CngxContextMenuItem'],
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
    Right-click for document actions
  </div>

  <cngx-context-menu ariaLabel="Document actions" #menu="cngxContextMenu">
    <cngx-context-menu-item value="rename" (select)="act('Rename'); menu.popover.hide()">
      Rename
    </cngx-context-menu-item>
    <cngx-context-menu-item value="duplicate" (select)="act('Duplicate'); menu.popover.hide()">
      Duplicate
    </cngx-context-menu-item>
    <cngx-context-menu-divider />
    <cngx-context-menu-item [submenu]="exportMenu">Export as</cngx-context-menu-item>
  </cngx-context-menu>

  <cngx-context-menu ariaLabel="Export format" #exportMenu="cngxContextMenu">
    <cngx-context-menu-item
      value="pdf"
      (select)="act('Export PDF'); exportMenu.popover.hide(); menu.popover.hide()"
    >
      PDF
    </cngx-context-menu-item>
    <cngx-context-menu-item
      value="csv"
      (select)="act('Export CSV'); exportMenu.popover.hide(); menu.popover.hide()"
    >
      CSV
    </cngx-context-menu-item>
    <cngx-context-menu-item
      value="png"
      (select)="act('Export PNG'); exportMenu.popover.hide(); menu.popover.hide()"
    >
      PNG
    </cngx-context-menu-item>
  </cngx-context-menu>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Last action</span>
      <span class="event-value">{{ lastAction() ?? '-' }}</span>
    </div>
  </div>`,
};
