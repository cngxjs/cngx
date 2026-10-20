import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxContextMenu: three-level submenu',
  subtitle:
    'A submenu inside a submenu. "Export as" opens the format panel, and its "Image" item opens a third panel - by click, Enter or ArrowRight at every depth, with every parent panel kept open.',
  description:
    'Each nested panel is a sibling <code>&lt;cngx-context-menu&gt;</code> bound through <code>[submenu]</code>. Only the root panel is opened by a trigger, so a nested panel hands its click / Enter activation and its ArrowLeft / ArrowRight / Escape keys to the panel it was opened from, up to the root, whose trigger resolves the deepest open menu. ArrowLeft closes one level at a time; Escape closes the innermost panel first.',
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
    "import { CngxContextMenu, CngxContextMenuFor, CngxContextMenuItem } from '@cngx/ui/context-menu';",
  ],
  imports: ['CngxContextMenu', 'CngxContextMenuFor', 'CngxContextMenuItem'],
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
    <cngx-context-menu-item [submenu]="exportMenu">Export as</cngx-context-menu-item>
    <cngx-context-menu-item value="rename" (select)="act('Rename'); menu.popover.hide()">
      Rename
    </cngx-context-menu-item>
  </cngx-context-menu>

  <cngx-context-menu ariaLabel="Export format" #exportMenu="cngxContextMenu">
    <cngx-context-menu-item [submenu]="imageMenu">Image</cngx-context-menu-item>
    <cngx-context-menu-item
      value="pdf"
      (select)="act('Export PDF'); exportMenu.popover.hide(); menu.popover.hide()"
    >
      PDF
    </cngx-context-menu-item>
  </cngx-context-menu>

  <cngx-context-menu ariaLabel="Image format" #imageMenu="cngxContextMenu">
    <cngx-context-menu-item
      value="png"
      (select)="act('Export PNG'); imageMenu.popover.hide(); exportMenu.popover.hide(); menu.popover.hide()"
    >
      PNG
    </cngx-context-menu-item>
    <cngx-context-menu-item
      value="svg"
      (select)="act('Export SVG'); imageMenu.popover.hide(); exportMenu.popover.hide(); menu.popover.hide()"
    >
      SVG
    </cngx-context-menu-item>
  </cngx-context-menu>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Last action</span>
      <span class="event-value">{{ lastAction() ?? '-' }}</span>
    </div>
  </div>`,
};
