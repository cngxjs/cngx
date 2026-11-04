import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDrawer: Filter panel, push',
  subtitle:
    'A <code>push</code> panel lays out next to the content, which stays in use: no scrim, no <code>inert</code>, no focus trap. The chips switch <code>[mode]</code> and <code>modality</code> to compare.',
  description:
    'A filter panel next to an order list, the inspector use of a drawer. The Filters button is a [cngxPanelTrigger]; the panel pushes the list aside, and the list keeps reacting to the filters while the panel is open. The chips above compare the mode and modality combinations: over with the mode default or page is a modal dialog with a scrim over the whole frame, over with contained scrims and inerts only the [cngxDrawer] host below the header, and none keeps everything operable. push is never modal: page or contained with push resolve to none and warn CNGX1075 in the console. Escape and the close button close it in every combination; a press outside closes only the over panel, so working in the list keeps the push panel open.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition', 'behavior', 'a11y-pattern'],
  apiComponents: ['CngxDrawer', 'CngxDrawerPanel', 'CngxDrawerContent', 'CngxPanelTrigger'],
  moduleImports: [
    "import { CngxDrawer, CngxDrawerContent, CngxDrawerPanel, CngxPanelTrigger, type CngxDrawerModality, type DrawerMode } from '@cngx/common/layout';",
    "import { CngxIconButton } from '@cngx/common/button';",
    "import { CngxIcon } from '@cngx/common/display';",
    "import { MatIconModule } from '@angular/material/icon';",
  ],
  imports: [
    'CngxDrawer',
    'CngxDrawerPanel',
    'CngxDrawerContent',
    'CngxPanelTrigger',
    'CngxIconButton',
    'CngxIcon',
    'MatIconModule',
  ],
  setup: `
  protected readonly mode = signal<DrawerMode>('push');
  protected readonly modality = signal<CngxDrawerModality | undefined>(undefined);
  protected readonly statuses = ['Open', 'Shipped', 'Cancelled'] as const;
  protected readonly shown = signal<ReadonlySet<string>>(new Set(['Open', 'Shipped']));
  protected readonly orders = Array.from({ length: 12 }, (_, i) => ({
    id: 1040 + i,
    status: this.statuses[i % 3],
  }));
  protected readonly visibleOrders = computed(() =>
    this.orders.filter((order) => this.shown().has(order.status)),
  );

  protected toggleStatus(status: string, checked: boolean): void {
    const next = new Set(this.shown());
    if (checked) {
      next.add(status);
    } else {
      next.delete(status);
    }
    this.shown.set(next);
  }`,
  template: `
  <div class="demo-drawer-container demo-drawer-container--bordered demo-app-frame">
    <header class="demo-app-header">
      <span class="demo-app-brand">Orders</span>
      <span class="demo-app-spacer"></span>
      <button type="button" class="sort-btn" [cngxPanelTrigger]="filters">Filters</button>
    </header>

    <div cngxDrawer #filters="cngxDrawer" panelId="order-filters" class="cngx-drawer demo-app-body">
      <aside [cngxDrawerPanel]="filters" [mode]="mode()" [modality]="modality()"
             [closeOnClickOutside]="mode() === 'over'"
             aria-label="Filters" class="demo-drawer-panel"
             [class.demo-drawer-panel--static]="mode() === 'push'">
        <div class="demo-app-header">
          <strong>Filters</strong>
          <span class="demo-app-spacer"></span>
          <button type="button" cngxIconButton aria-label="Close filters" (click)="filters.close()">
            <cngx-icon><mat-icon>close</mat-icon></cngx-icon>
          </button>
        </div>
        <fieldset class="demo-drawer-panel-content">
          <legend>Status</legend>
          @for (status of statuses; track status) {
            <label>
              <input type="checkbox" [checked]="shown().has(status)"
                     (change)="toggleStatus(status, $any($event.target).checked)" />
              {{ status }}
            </label>
          }
        </fieldset>
      </aside>

      <main [cngxDrawerContent]="filters" class="demo-drawer-main demo-app-main">
        <p>{{ visibleOrders().length }} of {{ orders.length }} orders</p>
        <ul class="demo-list-flush">
          @for (order of visibleOrders(); track order.id) {
            <li class="demo-list-row">Order {{ order.id }}: {{ order.status }}</li>
          }
        </ul>
      </main>
    </div>
  </div>`,
  setupChrome: `
  protected readonly modes: DrawerMode[] = ['over', 'push'];
  protected readonly modalities: { label: string; value: CngxDrawerModality | undefined }[] = [
    { label: 'mode default', value: undefined },
    { label: 'page', value: 'page' },
    { label: 'contained', value: 'contained' },
    { label: 'none', value: 'none' },
  ];
  protected readonly switching = signal(false);

  protected setMode(drawer: CngxDrawer, next: DrawerMode): void {
    this.snapClosed(drawer);
    this.mode.set(next);
  }

  protected setModality(drawer: CngxDrawer, next: CngxDrawerModality | undefined): void {
    this.snapClosed(drawer);
    this.modality.set(next);
  }

  // Close first and snap: the panel changes between an absolute overlay and
  // an in-flow item, and animating that change makes the layout jump.
  private snapClosed(drawer: CngxDrawer): void {
    this.switching.set(true);
    drawer.close();
    requestAnimationFrame(() => requestAnimationFrame(() => this.switching.set(false)));
  }`,
  templateChromeBefore: `
  <div [class.demo-drawer-switching]="switching()">
    <div class="filter-row" role="group" aria-label="Drawer mode">
      @for (m of modes; track m) {
        <button type="button" class="chip" [attr.aria-pressed]="mode() === m"
                (click)="setMode(filters, m)">{{ m }}</button>
      }
    </div>
    <div class="filter-row" role="group" aria-label="Drawer modality" style="margin-top: 8px">
      @for (m of modalities; track m.label) {
        <button type="button" class="chip" [attr.aria-pressed]="modality() === m.value"
                (click)="setModality(filters, m.value)">{{ m.label }}</button>
      }
    </div>
  </div>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">filters.opened()</span>
      <span class="event-value">{{ filters.opened() }}</span>
    </div>
  </div>`,
};
