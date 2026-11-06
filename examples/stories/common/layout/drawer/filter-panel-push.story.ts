import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDrawer: Filter panel, push',
  subtitle:
    'A <code>push</code> panel lays out next to the content, which stays in use: no scrim, no <code>inert</code>, no focus trap. The chips switch <code>[mode]</code> and <code>modality</code>, and the line under them says what the current combination blocks.',
  description:
    'A filter panel next to an order list, the inspector use of a drawer. The Filters button is a [cngxPanelToggle]; it shows the panel glyph (chevron away from the panel while closed, toward it while open) while the panel pushes or overlays without blocking, and the menu bars and cross once a modal over panel blocks the page. The panel pushes the list aside, and the list keeps reacting to the filters while the panel is open. The modality input says how much of the page the open panel blocks. Whole page blocked (page) is a modal dialog: a scrim over the list, everything else inert, focus trapped. Only this area blocked (contained) puts the scrim and inert on the [cngxDrawer] host below the header only, so the header stays clickable and focus is not trapped. Nothing blocked (none) keeps everything operable. Mode default means page for over and none for push. push never blocks: page or contained with push resolve to none and warn CNGX1076 in the console, so the modality chips are disabled while push is selected. Escape and the close button close the panel in every combination; a press outside closes only the over panel, so working in the list keeps the push panel open.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition', 'behavior', 'a11y-pattern'],
  apiComponents: ['CngxDrawer', 'CngxDrawerPanel', 'CngxDrawerContent', 'CngxPanelToggle'],
  moduleImports: [
    "import { CngxDrawer, CngxDrawerContent, CngxDrawerPanel, CngxPanelToggle, type CngxDrawerModality, type DrawerMode } from '@cngx/common/layout';",
    "import { CngxIconButton } from '@cngx/common/button';",
    "import { CngxIcon } from '@cngx/common/display';",
    "import { MatIconModule } from '@angular/material/icon';",
  ],
  imports: [
    'CngxDrawer',
    'CngxDrawerPanel',
    'CngxDrawerContent',
    'CngxPanelToggle',
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
      <button type="button" [cngxPanelToggle]="filters" label="Filters"></button>
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
  protected readonly modes: { label: string; value: DrawerMode }[] = [
    { label: 'Overlays the list (over)', value: 'over' },
    { label: 'Pushes the list aside (push)', value: 'push' },
  ];
  protected readonly modalities: { label: string; value: CngxDrawerModality | undefined }[] = [
    { label: 'Mode default', value: undefined },
    { label: 'Whole page blocked (page)', value: 'page' },
    { label: 'Only this area blocked (contained)', value: 'contained' },
    { label: 'Nothing blocked (none)', value: 'none' },
  ];
  protected readonly switching = signal(false);
  protected readonly modalityLocked = computed(() => this.mode() === 'push');
  protected readonly explanation = computed(() => {
    if (this.mode() === 'push') {
      const ignored = this.modality() === 'page' || this.modality() === 'contained';
      return (
        'push is never blocking: the panel sits beside the list, which stays clickable. No scrim, no inert, no focus trap.' +
        (ignored ? ' The chosen ' + this.modality() + ' resolves to none and CNGX1076 warns in the console.' : '')
      );
    }
    switch (this.modality() ?? 'page') {
      case 'page':
        return 'Whole page blocked: a scrim covers the list, the Orders header and the rest of the page are inert, and focus is trapped in the panel. Escape, the close button or a press on the scrim closes it.';
      case 'contained':
        return 'Only this area blocked: the scrim and inert cover the list below the header; the Orders header and the rest of the page stay clickable. Focus moves into the panel, and Tab can leave it.';
      default:
        return 'Nothing blocked: no scrim, no inert, no focus trap. The list stays clickable, and a press on it closes the overlay panel.';
    }
  });

  protected setMode(drawer: CngxDrawer, next: DrawerMode): void {
    this.snapClosed(drawer);
    this.mode.set(next);
  }

  protected setModality(drawer: CngxDrawer, next: CngxDrawerModality | undefined): void {
    if (this.modalityLocked()) {
      return;
    }
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
      @for (m of modes; track m.value) {
        <button type="button" class="chip" [attr.aria-pressed]="mode() === m.value"
                (click)="setMode(filters, m.value)">{{ m.label }}</button>
      }
    </div>
    <div class="filter-row" role="group" aria-label="Drawer modality" style="margin-top: 8px">
      @for (m of modalities; track m.label) {
        <button type="button" class="chip" [attr.aria-pressed]="modality() === m.value"
                [attr.aria-disabled]="modalityLocked() ? 'true' : null"
                [attr.aria-describedby]="modalityLocked() ? 'push-modality-reason' : null"
                (click)="setModality(filters, m.value)">{{ m.label }}</button>
      }
    </div>
    <p class="demo-hint" aria-live="polite">{{ explanation() }}</p>
    <p id="push-modality-reason" class="demo-hint demo-hint--small" [hidden]="!modalityLocked()">
      The blocking choices are disabled because push never blocks. Switch to over to compare them.
    </p>
  </div>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">filters.opened()</span>
      <span class="event-value">{{ filters.opened() }}</span>
    </div>
  </div>`,
};
