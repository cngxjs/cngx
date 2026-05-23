import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDrawer: Controlled mode',
  subtitle:
    'Bind <code>[cngxDrawerOpened]</code> to a signal for controlled state. The parent owns the truth; internal <code>toggle()</code> still emits <code>(openedChange)</code>, but the controlled input wins.',
  description:
    'Demonstrates the controlled input precedence rule: when [cngxDrawerOpened] is bound, drawer.opened() resolves to the parent signal and internal toggle() routes through (openedChange) back to that signal.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxDrawer', 'CngxDrawerPanel'],
  moduleImports: ["import { CngxDrawer, CngxDrawerPanel } from '@cngx/common/layout';"],
  imports: ['CngxDrawer', 'CngxDrawerPanel'],
  setup: `protected readonly controlledOpen = signal(false);`,
  template: `  <div cngxDrawer #ctrlDrawer="cngxDrawer"
       [cngxDrawerOpened]="controlledOpen()"
       (openedChange)="controlledOpen.set($event)"
       class="demo-drawer-container demo-drawer-container--bordered">
    <div class="demo-drawer-layout">
      <nav [cngxDrawerPanel]="ctrlDrawer" position="left"
           [enabled]="ctrlDrawer.opened()"
           class="demo-drawer-panel">
        <div class="demo-drawer-panel-content">
          <strong>Controlled</strong>
          <p>State owned by parent signal.</p>
          <button type="button" class="sort-btn" (click)="ctrlDrawer.close()">Close</button>
        </div>
      </nav>

      <main class="demo-drawer-main">
        <p>Controlled mode - the drawer opens and closes via the external signal.</p>
      </main>
    </div>
  </div>`,
  templateChrome: `<div class="button-row">
    <button type="button" class="sort-btn" (click)="controlledOpen.set(!controlledOpen())">
      External toggle: {{ controlledOpen() ? 'open' : 'closed' }}
    </button>
  </div>
<div class="status-row">
    <span class="status-badge" [class.active]="controlledOpen()">
      controlledOpen: {{ controlledOpen() }}
    </span>
  </div>`,
};
