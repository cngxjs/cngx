import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxContextMenu: projected icons',
  subtitle:
    'Bring your own icon per item. Project any element into the icon slot with the <code>cngxMenuItemIcon</code> marker - an inline <code>&lt;svg&gt;</code>, an icon component, whatever your design system ships. The string <code>[icon]</code> input stays as a shorthand for single-character glyphs.',
  description:
    'The item template projects <code>[cngxMenuItemIcon]</code> through <code>&lt;ng-content&gt;</code>, so a rich icon needs no eject to the base <code>[cngxMenuItem]</code>. The marker directive applies <code>aria-hidden</code> and the icon BEM class for you; when a marker is projected the string <code>[icon]</code> shorthand is suppressed, so the two never double up.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['composition', 'visual-variants'],
  references: [
    {
      label: 'WAI-ARIA APG: Menu Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu/',
    },
  ],
  apiComponents: ['CngxContextMenu', 'CngxContextMenuFor', 'CngxContextMenuItem'],
  moduleImports: [
    "import { CngxContextMenu, CngxContextMenuFor, CngxContextMenuItem } from '@cngx/ui/context-menu';",
    "import { CngxMenuItemIcon } from '@cngx/common/interactive';",
  ],
  imports: ['CngxContextMenu', 'CngxContextMenuFor', 'CngxContextMenuItem', 'CngxMenuItemIcon'],
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

  <cngx-context-menu ariaLabel="File actions" #menu="cngxContextMenu">
    <cngx-context-menu-item value="new" (select)="act('New'); menu.popover.hide()">
      <svg cngxMenuItemIcon viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4">
        <path d="M9 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5L9 1.5Z" />
        <path d="M9 1.5v4h4M8 8v4M6 10h4" />
      </svg>
      New file
    </cngx-context-menu-item>

    <cngx-context-menu-item value="duplicate" (select)="act('Duplicate'); menu.popover.hide()">
      <svg cngxMenuItemIcon viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4">
        <rect x="5.5" y="5.5" width="8" height="8" rx="1" />
        <path d="M10.5 5.5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v6.5a1 1 0 0 0 1 1h2.5" />
      </svg>
      Duplicate
    </cngx-context-menu-item>

    <cngx-context-menu-item value="rename" icon="✎" (select)="act('Rename'); menu.popover.hide()">
      Rename (string shorthand)
    </cngx-context-menu-item>

    <cngx-context-menu-item value="delete" (select)="act('Delete'); menu.popover.hide()">
      <svg cngxMenuItemIcon viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4">
        <path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9L12 4" />
      </svg>
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
