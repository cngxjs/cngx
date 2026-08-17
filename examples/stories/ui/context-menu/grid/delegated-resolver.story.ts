import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxContextMenu: delegated resolver over a grid',
  subtitle:
    'One trigger, 24 rows. The single <code>[cngxContextMenuFor]</code> lives on the table body; <code>[cngxContextMenuResolve]</code> derives the row from the <code>contextmenu</code> event target, so a virtualized grid keeps exactly one trigger instance instead of one per row.',
  description:
    'The resolver walks up from <code>event.target</code> to the nearest <code>[data-row-id]</code> and returns that row - or <code>null</code> to leave the native menu untouched (right-click the header). The menu content reads the resolved row via <code>let-row</code>; the Delete action disables itself for managers straight from the per-row datum.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'behavior'],
  references: [
    {
      label: 'WAI-ARIA APG: Menu Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu/',
    },
  ],
  apiComponents: ['CngxContextMenu', 'CngxContextMenuFor', 'CngxContextMenuContent', 'CngxContextMenuItem'],
  moduleImports: [
    "import { CngxContextMenu, CngxContextMenuContent, CngxContextMenuDivider, CngxContextMenuFor, CngxContextMenuItem } from '@cngx/ui/context-menu';",
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  imports: [
    'CngxContextMenu',
    'CngxContextMenuContent',
    'CngxContextMenuDivider',
    'CngxContextMenuFor',
    'CngxContextMenuItem',
  ],
  setup: `protected readonly rows: (Person & { id: number })[] = Array.from(
  { length: 24 },
  (_, i) => ({ id: i, ...PEOPLE[i % PEOPLE.length] }),
);
protected readonly lastAction = signal<string | null>(null);

protected resolveRow = (event: MouseEvent): (Person & { id: number }) | null => {
  const el = (event.target as HTMLElement).closest('[data-row-id]');
  if (!el) {
    return null;
  }
  const id = Number(el.getAttribute('data-row-id'));
  return this.rows.find((row) => row.id === id) ?? null;
};

protected act(action: string, row: Person): void {
  this.lastAction.set(action + ' → ' + row.name);
}`,
  template: `  <table
    class="demo-ctx-grid"
    style="width:100%;border-collapse:collapse"
    [cngxContextMenuFor]="menu"
    [cngxContextMenuResolve]="resolveRow"
  >
    <thead>
      <tr>
        <th scope="col" style="text-align:left;padding:6px 10px">Name</th>
        <th scope="col" style="text-align:left;padding:6px 10px">Role</th>
        <th scope="col" style="text-align:left;padding:6px 10px">Location</th>
      </tr>
    </thead>
    <tbody>
      @for (row of rows; track row.id) {
        <tr
          [attr.data-row-id]="row.id"
          tabindex="0"
          style="cursor:context-menu"
        >
          <td style="padding:6px 10px;border-top:1px solid var(--cngx-color-border, oklch(0.88 0.005 250))">{{ row.name }}</td>
          <td style="padding:6px 10px;border-top:1px solid var(--cngx-color-border, oklch(0.88 0.005 250))">{{ row.role }}</td>
          <td style="padding:6px 10px;border-top:1px solid var(--cngx-color-border, oklch(0.88 0.005 250))">{{ row.location }}</td>
        </tr>
      }
    </tbody>
  </table>

  <cngx-context-menu ariaLabel="Row actions" #menu="cngxContextMenu">
    <ng-template cngxContextMenuContent let-row>
      <cngx-context-menu-item value="open" (select)="act('Open', row); menu.popover.hide()">
        Open {{ row.name }}
      </cngx-context-menu-item>
      <cngx-context-menu-item value="edit" (select)="act('Edit', row); menu.popover.hide()">
        Edit
      </cngx-context-menu-item>
      <cngx-context-menu-divider />
      <cngx-context-menu-item
        value="delete"
        [disabled]="row.role === 'Manager'"
        (select)="act('Delete', row); menu.popover.hide()"
      >
        Delete
      </cngx-context-menu-item>
    </ng-template>
  </cngx-context-menu>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Last action</span>
      <span class="event-value">{{ lastAction() ?? '-' }}</span>
    </div>
  </div>`,
};
