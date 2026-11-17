import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDrawer: Controlled mode',
  subtitle:
    'A drawer whose open state the parent owns: bind <code>[cngxDrawerOpened]</code> to a signal. The parent owns the truth; internal <code>toggle()</code> still emits <code>(openedChange)</code>, but the controlled input wins.',
  description:
    'Demonstrates the controlled input precedence rule: when [cngxDrawerOpened] is bound, drawer.opened() resolves to the parent signal and internal toggle() routes through (openedChange) back to that signal.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxDrawer', 'CngxDrawerPanel'],
  moduleImports: [
    "import { CngxDrawer, CngxDrawerPanel } from '@cngx/common/layout';",
    "import { CngxStack } from '@cngx/ui/layout';",
  ],
  imports: ['CngxDrawer', 'CngxDrawerPanel', 'CngxStack'],
  setup: `protected readonly controlledOpen = signal(false);`,
  template: `  <div cngxDrawer #ctrlDrawer="cngxDrawer"
       [cngxDrawerOpened]="controlledOpen()"
       (openedChange)="controlledOpen.set($event)"
       class="cngx-drawer">
    <nav id="ctrl-panel" [cngxDrawerPanel]="ctrlDrawer" position="left" label="Controlled panel">
      <cngx-stack gap="sm" align="start" style="padding: var(--cngx-space-md, 1rem)">
        <strong>Controlled</strong>
        <p>State owned by parent signal.</p>
        <button type="button" (click)="ctrlDrawer.close()">Close</button>
      </cngx-stack>
    </nav>

    <div style="flex: 1 1 auto; padding: var(--cngx-space-md, 1rem)">
      <p>Controlled mode - the drawer opens and closes via the external signal.</p>
    </div>
  </div>`,
  templateChrome: `<div class="button-row">
    <button type="button" class="sort-btn" aria-controls="ctrl-panel"
            [attr.aria-expanded]="controlledOpen()"
            (click)="controlledOpen.set(!controlledOpen())">
      External toggle: {{ controlledOpen() ? 'open' : 'closed' }}
    </button>
  </div>
<div class="status-row">
    <span class="status-badge" [class.active]="controlledOpen()">
      controlledOpen: {{ controlledOpen() }}
    </span>
  </div>`,
};
