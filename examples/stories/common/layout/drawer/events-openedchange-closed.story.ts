import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Events — openedChange & closed',
  subtitle: '<code>(openedChange)</code> emits on every state change. <code>(closed)</code> emits only on close. Both are useful for side effects like analytics or saving state.',
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
    'import { CngxDrawer, CngxDrawerPanel } from \'@cngx/common\';',
  ],
  imports: ['CngxDrawer', 'CngxDrawerPanel'],
  setup: `protected readonly events = signal<string[]>([]);
  protected logEvent(name: string): void {
    this.events.update(e => [name + ' @ ' + new Date().toLocaleTimeString(), ...e].slice(0, 5));
  }`,
  template: `
  <div cngxDrawer #evDrawer="cngxDrawer"
       (openedChange)="logEvent('openedChange: ' + $event)"
       (closed)="logEvent('closed')"
       class="drawer-container drawer-container--bordered">
    <button class="sort-btn" (click)="evDrawer.toggle()">Toggle</button>

    <div class="drawer-layout">
      <aside [cngxDrawerPanel]="evDrawer" position="right"
             [enabled]="evDrawer.opened()"
             class="drawer-panel">
        <div class="drawer-panel-content">
          <strong>Right panel</strong>
          <button class="sort-btn" (click)="evDrawer.close()">Close</button>
        </div>
      </aside>

      <main class="drawer-main">
        <p>Open/close to see events logged below.</p>
      </main>
    </div>
  </div>

  <div class="event-grid">
    @for (ev of events(); track $index) {
      <div class="event-row">
        <span class="event-value">{{ ev }}</span>
      </div>
    } @empty {
      <div class="event-row"><span class="event-value">No events yet</span></div>
    }
  </div>`,
};
