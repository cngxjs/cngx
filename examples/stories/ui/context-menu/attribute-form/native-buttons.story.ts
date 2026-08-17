import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxContextMenu: native button items',
  subtitle:
    'The dual selector on native elements. <code>button[cngxContextMenuItem]</code> and <code>hr[cngxContextMenuDivider]</code> attach the same brains to real form controls - the <code>button[mat-menu-item]</code> precedent.',
  description:
    'Each row is a native <code>&lt;button type="button"&gt;</code> carrying <code>cngxContextMenuItem</code>; the divider is a bare <code>&lt;hr cngxContextMenuDivider&gt;</code>. The global reset strips the UA chrome and the item theme repaints the row, so the attribute form is visually identical to the element form while staying a semantic button.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Menu Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu/',
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
    Right-click for file actions
  </div>

  <cngx-context-menu ariaLabel="File actions" #menu="cngxContextMenu">
    <button type="button" cngxContextMenuItem value="new" (select)="act('New file'); menu.popover.hide()">
      New file
    </button>
    <button type="button" cngxContextMenuItem value="open" (select)="act('Open'); menu.popover.hide()">
      Open…
    </button>
    <hr cngxContextMenuDivider />
    <button type="button" cngxContextMenuItem value="rename" (select)="act('Rename'); menu.popover.hide()">
      Rename
    </button>
    <button type="button" cngxContextMenuItem value="delete" (select)="act('Delete'); menu.popover.hide()">
      Delete
    </button>
  </cngx-context-menu>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Last action</span>
      <span class="event-value">{{ lastAction() ?? '-' }}</span>
    </div>
  </div>`,
};
