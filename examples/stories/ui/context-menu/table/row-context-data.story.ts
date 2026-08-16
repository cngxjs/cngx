import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxContextMenu: per-row context data',
  subtitle:
    'Right-click any row (or focus it and press Shift+F10). One <code>cngx-context-menu</code> serves every row - each opens with its own datum through <code>[cngxContextMenuData]</code>, and the menu content reads that row via <code>let-row</code>.',
  description:
    'Each row binds <code>[cngxContextMenuFor]="menu"</code> and its own <code>[cngxContextMenuData]="person"</code>. The single <code>cngx-context-menu</code> panel derives <code>context()</code> from the popover visibility, so the lazy <code>cngxContextMenuContent</code> template rebuilds with the right row on every open and nulls out on close - no manual sync. The Delete action disables itself for managers, driven by the per-row datum.',
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
  apiComponents: ['CngxContextMenu', 'CngxContextMenuFor', 'CngxContextMenuContent'],
  moduleImports: [
    "import { CngxContextMenu, CngxContextMenuContent, CngxContextMenuFor } from '@cngx/ui/context-menu';",
    "import { CngxMenuItem, CngxMenuSeparator } from '@cngx/common/interactive';",
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  imports: [
    'CngxContextMenu',
    'CngxContextMenuContent',
    'CngxContextMenuFor',
    'CngxMenuItem',
    'CngxMenuSeparator',
  ],
  setup: `protected readonly rows: Person[] = PEOPLE.slice(0, 3);
protected readonly lastAction = signal<string | null>(null);

protected act(action: string, person: Person): void {
  this.lastAction.set(action + ' → ' + person.name);
}`,
  template: `  <table class="demo-context-table">
    <tbody>
      @for (person of rows; track person.name) {
        <tr
          class="demo-context-row"
          tabindex="0"
          [cngxContextMenuFor]="menu"
          [cngxContextMenuData]="person"
        >
          <td>{{ person.name }}</td>
          <td>{{ person.role }}</td>
          <td>{{ person.location }}</td>
        </tr>
      }
    </tbody>
  </table>

  <cngx-context-menu ariaLabel="Row actions" #menu="cngxContextMenu">
    <ng-template cngxContextMenuContent let-row>
      <button cngxMenuItem type="button" (click)="act('Open', row); menu.popover.hide()">
        Open {{ row.name }}
      </button>
      <button cngxMenuItem type="button" (click)="act('Duplicate', row); menu.popover.hide()">
        Duplicate
      </button>
      <hr cngxMenuSeparator />
      <button
        cngxMenuItem
        type="button"
        [disabled]="row.role === 'Manager'"
        (click)="act('Delete', row); menu.popover.hide()"
      >
        Delete
      </button>
    </ng-template>
  </cngx-context-menu>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Last action</span>
      <span class="event-value">{{ lastAction() ?? '-' }}</span>
    </div>
  </div>`,
  css: `.demo-context-table {
  width: 100%;
  border-collapse: collapse;
}
.demo-context-row {
  cursor: context-menu;
}
.demo-context-row td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--cngx-color-border, oklch(0.88 0.005 250));
}
.demo-context-row:focus-visible {
  outline: 2px solid var(--cngx-color-primary, oklch(0.66 0.19 50));
  outline-offset: -2px;
}`,
};
