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
  moduleImports: ["import { CngxDrawer, CngxDrawerPanel } from '@cngx/common/layout';"],
  imports: ['CngxDrawer', 'CngxDrawerPanel'],
  setup: `protected readonly events = signal<string[]>([]);
  protected logEvent(name: string): void {
    this.events.update(e => [name + ' @ ' + new Date().toLocaleTimeString(), ...e].slice(0, 5));
  }`,
  template: `  <div cngxDrawer #evDrawer="cngxDrawer"
       (openedChange)="logEvent('openedChange: ' + $event)"
       (closed)="logEvent('closed')"
       class="demo-drawer-container demo-drawer-container--bordered">
    <div class="button-row" style="padding: 0.5rem;">
      <button type="button" class="sort-btn" (click)="evDrawer.toggle()">Toggle</button>
    </div>

    <div class="demo-drawer-layout">
      <aside [cngxDrawerPanel]="evDrawer" position="right"
             [enabled]="evDrawer.opened()"
             class="demo-drawer-panel">
        <div class="demo-drawer-panel-content">
          <strong>Right panel</strong>
          <button type="button" class="sort-btn" (click)="evDrawer.close()">Close</button>
        </div>
      </aside>

      <main class="demo-drawer-main">
        <p>Open or close the drawer to see the event log below.</p>
      </main>
    </div>
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
