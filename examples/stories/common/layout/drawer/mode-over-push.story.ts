import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDrawer: Mode over push',
  subtitle:
    '<code>[mode]</code> controls how the panel interacts with content. <strong>over</strong> (default) overlays content and is modal. <strong>push</strong> pushes content aside and is never modal. <code>[modal]</code> overrides the default for <strong>over</strong>.',
  description:
    'Compares the two DrawerMode values: over keeps the panel absolutely positioned above content and, by default, traps focus, inerts the content and locks its scrolling; push lays it out next to the content lane, which stays operable. The modality row below switches [modal] between the mode default, modal and non-modal; a modal push drawer resolves to non-modal and warns CNGX1075 in the console.',
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
  protected readonly modes: DrawerMode[] = ['over', 'push'];
  protected readonly modal = signal<boolean | undefined>(undefined);`,
  template: `
  <div class="filter-row" role="group" aria-label="Drawer mode">
    @for (m of modes; track m) {
      <button type="button" class="chip" [attr.aria-pressed]="mode() === m"
              (click)="mode.set(m)">{{ m }}</button>
    }
  </div>

  <div cngxDrawer #modeDrawer="cngxDrawer" class="demo-drawer-container demo-drawer-container--bordered">
    <div class="button-row" style="padding: 0.5rem;">
      <button type="button" class="sort-btn" aria-controls="mode-panel"
              [attr.aria-expanded]="modeDrawer.opened()" (click)="modeDrawer.toggle()">
        Toggle {{ mode() }} drawer
      </button>
    </div>

    <div class="demo-drawer-layout demo-drawer-layout--relative"
         [class.demo-drawer-layout--push]="mode() === 'push'">
      <aside id="mode-panel" [cngxDrawerPanel]="modeDrawer" position="left"
             [mode]="mode()" [modal]="modal()"
             class="demo-drawer-panel"
             [class.demo-drawer-panel--static]="mode() === 'push'">
        <div class="demo-drawer-panel-content">
          <strong>{{ mode() }} panel</strong>
          <button type="button" class="sort-btn" (click)="modeDrawer.close()">Close</button>
        </div>
      </aside>

      <main [cngxDrawerContent]="modeDrawer" class="demo-drawer-main demo-drawer-main--tall">
        <p>Mode: <strong>{{ mode() }}</strong></p>
        @if (mode() === 'push') {
          <p>Content shifts when the drawer opens and stays operable.</p>
        } @else {
          <p>Panel overlays content.</p>
        }
      </main>
    </div>
  </div>`,
  setupChrome: `
  protected readonly modalities: { label: string; value: boolean | undefined }[] = [
    { label: 'mode default', value: undefined },
    { label: 'modal', value: true },
    { label: 'non-modal', value: false },
  ];`,
  templateChrome: `
  <div class="filter-row" role="group" aria-label="Drawer modality" style="margin-top: 12px">
    @for (m of modalities; track m.label) {
      <button type="button" class="chip" [attr.aria-pressed]="modal() === m.value"
              (click)="modal.set(m.value)">{{ m.label }}</button>
    }
  </div>
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">drawer.opened()</span>
      <span class="event-value">{{ modeDrawer.opened() }}</span>
    </div>
  </div>`,
};
