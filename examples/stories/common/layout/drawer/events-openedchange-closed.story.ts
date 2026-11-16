import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDrawer: Events openedChange and closed',
  subtitle:
    '<code>(openedChange)</code> emits on every state change. <code>(closed)</code> emits only on close. Both are useful for side effects like analytics or saving state.',
  description:
    'Logs (openedChange) on every open and close, and (closed) on close only, so analytics or persistence hooks can subscribe to whichever signal matches the side effect they need.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['behavior', 'integration'],
  apiComponents: ['CngxDrawer', 'CngxDrawerPanel'],
  moduleImports: [
    "import { CngxDrawer, CngxDrawerPanel } from '@cngx/common/layout';",
    "import { CngxStack } from '@cngx/ui/layout';",
  ],
  imports: ['CngxDrawer', 'CngxDrawerPanel', 'CngxStack'],
  setup: `protected readonly events = signal<string[]>([]);
  protected logEvent(name: string): void {
    this.events.update(e => [name + ' @ ' + new Date().toLocaleTimeString(), ...e].slice(0, 5));
  }`,
  template: `  <div cngxDrawer #evDrawer="cngxDrawer"
       (openedChange)="logEvent('openedChange: ' + $event)"
       (closed)="logEvent('closed')"
       class="cngx-drawer">
    <aside id="ev-panel" [cngxDrawerPanel]="evDrawer" position="right" label="Right panel">
      <cngx-stack gap="sm" align="start" style="padding: var(--cngx-space-md, 1rem)">
        <strong>Right panel</strong>
        <button type="button" (click)="evDrawer.close()">Close</button>
      </cngx-stack>
    </aside>

    <main style="flex: 1 1 auto; padding: var(--cngx-space-md, 1rem)">
      <button type="button" aria-controls="ev-panel"
              [attr.aria-expanded]="evDrawer.opened()" (click)="evDrawer.toggle()">Toggle</button>
      <p>Open or close the drawer to see the event log below.</p>
    </main>
  </div>`,
  templateChrome: `<div class="event-grid">
    @for (ev of events(); track $index) {
      <div class="event-row">
        <span class="event-value">{{ ev }}</span>
      </div>
    } @empty {
      <div class="event-row"><span class="event-value">No events yet</span></div>
    }
  </div>`,
};
