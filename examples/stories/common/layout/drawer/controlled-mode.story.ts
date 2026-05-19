import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Controlled Mode',
  subtitle: 'Bind <code>[cngxDrawerOpened]</code> to a signal for controlled state. The parent owns the truth — internal <code>toggle()</code> still emits <code>(openedChange)</code> but the controlled input wins.',
  description: 'Headless drawer/sidebar system: CngxDrawer (state), CngxDrawerPanel (sliding panel), CngxDrawerContent (content offset). Supports left/right/top/bottom, focus trapping, click-outside close, Escape key, and controlled+uncontrolled modes.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxDrawer',
    'CngxDrawerPanel',
    'CngxDrawerContent',
  ],
  moduleImports: [
    'import { CngxDrawer, CngxDrawerPanel, type DrawerMode } from \'@cngx/common\';',
  ],
  imports: ['CngxDrawer', 'CngxDrawerPanel'],
  setup: `protected readonly controlledOpen = signal(false);
  protected readonly mode = signal<DrawerMode>('over');`,
  template: `  <div cngxDrawer #ctrlDrawer="cngxDrawer"
       [cngxDrawerOpened]="controlledOpen()"
       (openedChange)="controlledOpen.set($event)"
       class="drawer-container drawer-container--bordered">
    <div class="drawer-layout">
      <nav [cngxDrawerPanel]="ctrlDrawer" position="left"
           [enabled]="ctrlDrawer.opened()"
           class="drawer-panel">
        <div class="drawer-panel-content">
          <strong>Controlled</strong>
          <p>State owned by parent signal.</p>
          <button class="sort-btn" (click)="ctrlDrawer.close()">Close</button>
        </div>
      </nav>

      <main class="drawer-main">
        <p>Controlled mode — drawer opens/closes via the external signal.</p>
      </main>
    </div>
  </div>`,
  templateChrome: `<div class="button-row">
    <button class="sort-btn" (click)="controlledOpen.set(!controlledOpen())">
      External toggle: {{ controlledOpen() ? 'open' : 'closed' }}
    </button>
  </div>
<div class="status-row">
    <span class="status-badge" [class.active]="controlledOpen()">
      controlledOpen: {{ controlledOpen() }}
    </span>
  </div>`,
};
