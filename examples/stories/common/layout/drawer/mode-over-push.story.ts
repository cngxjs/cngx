import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDrawer: Mode over push',
  subtitle:
    '<code>[mode]</code> controls how the panel interacts with content. <strong>over</strong> (default) overlays content and is modal. <strong>push</strong> pushes content aside and is never modal. <code>[modal]</code> overrides the default for <strong>over</strong>.',
  description:
    'Compares the two DrawerMode values: over keeps the panel above the content lane and, by default, is modal: it traps focus, makes everything outside the panel inert, locks scrolling on the lane (the nearest scroll container above the panel, so the page itself keeps scrolling) and shows a scrim keyed on the panel modal class. push lays the panel out next to the lane, which stays operable. The rows above switch the mode and [modal] between the mode default, modal and non-modal; a modal push drawer resolves to non-modal and warns CNGX1075 in the console. While a modal drawer is open the rows are inert too, so the first click on them only closes the drawer.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition', 'behavior', 'a11y-pattern'],
  apiComponents: ['CngxDrawer', 'CngxDrawerPanel', 'CngxDrawerContent'],
  moduleImports: [
    "import { CngxDrawer, CngxDrawerPanel, CngxDrawerContent, type DrawerMode } from '@cngx/common/layout';",
  ],
  imports: ['CngxDrawer', 'CngxDrawerPanel', 'CngxDrawerContent'],
  setup: `protected readonly mode = signal<DrawerMode>('over');
  protected readonly modal = signal<boolean | undefined>(undefined);
  protected readonly rows = Array.from({ length: 12 }, (_, i) => i + 1);`,
  template: `
  <div cngxDrawer #modeDrawer="cngxDrawer"
       class="demo-drawer-container demo-drawer-container--bordered demo-drawer-container--scrim">
    <div class="demo-inline-actions" style="padding: 0.5rem;">
      <button type="button" class="sort-btn" aria-controls="mode-panel"
              [attr.aria-expanded]="modeDrawer.opened()" (click)="modeDrawer.toggle()">
        Toggle {{ mode() }} drawer
      </button>
    </div>

    <div class="demo-drawer-layout demo-drawer-layout--scroll"
         [class.demo-drawer-layout--push]="mode() === 'push'">
      <aside id="mode-panel" [cngxDrawerPanel]="modeDrawer" position="left"
             [mode]="mode()" [modal]="modal()"
             class="demo-drawer-panel"
             [class.demo-drawer-panel--static]="mode() === 'push'">
        <div class="demo-drawer-panel-content">
          <strong>{{ mode() }} panel</strong>
          <button type="button" class="sort-btn">Inbox</button>
          <button type="button" class="sort-btn">Archive</button>
          <button type="button" class="sort-btn" (click)="modeDrawer.close()">Close</button>
        </div>
      </aside>

      <main [cngxDrawerContent]="modeDrawer" class="demo-drawer-main">
        <p>Mode: <strong>{{ mode() }}</strong></p>
        @if (mode() === 'push') {
          <p>Content shifts when the drawer opens and stays operable.</p>
        } @else {
          <p>Panel overlays content.</p>
        }
        @for (row of rows; track row) {
          <p>Content row {{ row }}. Scroll the lane; a modal drawer locks it.</p>
        }
      </main>
    </div>
  </div>`,
  setupChrome: `
  protected readonly modes: DrawerMode[] = ['over', 'push'];
  protected readonly modalities: { label: string; value: boolean | undefined }[] = [
    { label: 'mode default', value: undefined },
    { label: 'modal', value: true },
    { label: 'non-modal', value: false },
  ];
  protected readonly switching = signal(false);

  protected setMode(drawer: CngxDrawer, next: DrawerMode): void {
    this.snapClosed(drawer);
    this.mode.set(next);
  }

  protected setModal(drawer: CngxDrawer, next: boolean | undefined): void {
    this.snapClosed(drawer);
    this.modal.set(next);
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
                (click)="setMode(modeDrawer, m)">{{ m }}</button>
      }
    </div>
    <div class="filter-row" role="group" aria-label="Drawer modality" style="margin-top: 8px">
      @for (m of modalities; track m.label) {
        <button type="button" class="chip" [attr.aria-pressed]="modal() === m.value"
                (click)="setModal(modeDrawer, m.value)">{{ m.label }}</button>
      }
    </div>
  </div>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">drawer.opened()</span>
      <span class="event-value">{{ modeDrawer.opened() }}</span>
    </div>
  </div>`,
};
