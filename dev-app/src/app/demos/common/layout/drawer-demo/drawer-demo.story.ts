import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Drawer',
  description:
    'Headless drawer/sidebar system: CngxDrawer (state), CngxDrawerPanel (sliding panel), CngxDrawerContent (content offset). Supports left/right/top/bottom, focus trapping, click-outside close, Escape key, and controlled+uncontrolled modes.',
  apiComponents: ['CngxDrawer', 'CngxDrawerPanel', 'CngxDrawerContent'],
  moduleImports: [
    "import { CngxDrawer, CngxDrawerPanel, CngxDrawerContent, CngxScrollLock, CngxBackdrop, type DrawerMode } from '@cngx/common';",
    "import { CngxAriaExpanded } from '@cngx/common';",
  ],
  setup: `
  // Controlled drawer
  protected readonly controlledOpen = signal(false);

  // Direction playground
  protected readonly direction = signal<'left' | 'right' | 'top' | 'bottom'>('left');
  protected readonly directions: ('left' | 'right' | 'top' | 'bottom')[] = ['left', 'right', 'top', 'bottom'];

  // Mode playground
  protected readonly mode = signal<DrawerMode>('over');
  protected readonly modes: DrawerMode[] = ['over', 'push', 'side'];

  // Event log
  protected readonly events = signal<string[]>([]);
  protected logEvent(name: string): void {
    this.events.update(e => [name + ' @ ' + new Date().toLocaleTimeString(), ...e].slice(0, 5));
  }
  `,
  sections: [
    {
      title: 'Basic — Scroll Lock + Backdrop',
      subtitle:
        '<code>[cngxScrollLock]</code> prevents body scroll when open. ' +
        '<code>[cngxBackdrop]</code> fades in an overlay and sets <code>inert</code> on sibling elements. ' +
        'Press <strong>Escape</strong>, click the backdrop, or click outside to close.',
      imports: ['CngxDrawer', 'CngxDrawerPanel', 'CngxDrawerContent', 'CngxAriaExpanded', 'CngxScrollLock', 'CngxBackdrop'],
      template: `
  <div cngxDrawer #drawer="cngxDrawer" [cngxScrollLock]="drawer.opened()" class="drawer-container">
    <button class="sort-btn"
            [cngxAriaExpanded]="drawer.opened()" [controls]="'basic-panel'"
            (click)="drawer.toggle()">
      {{ drawer.opened() ? 'Close' : 'Open' }} Drawer
    </button>

    <div class="drawer-layout">
      <div [cngxBackdrop]="drawer.opened()" (backdropClick)="drawer.close()"
           class="drawer-backdrop"></div>

      <nav [cngxDrawerPanel]="drawer" position="left"
           [enabled]="drawer.opened()" [autoFocus]="true"
           id="basic-panel" role="navigation"
           class="drawer-panel">
        <div class="drawer-panel-content">
          <strong>Navigation</strong>
          <a href="javascript:void(0)">Home</a>
          <a href="javascript:void(0)">Settings</a>
          <a href="javascript:void(0)">Profile</a>
          <button class="sort-btn" (click)="drawer.close()">Close</button>
        </div>
      </nav>

      <main [cngxDrawerContent]="drawer" class="drawer-main">
        <p>Main content area. The drawer slides over from the left.</p>
        <p>Press <strong>Escape</strong>, click the backdrop, or click outside to close.</p>
        <p><code>[cngxScrollLock]</code> prevents background scrolling.</p>
      </main>
    </div>
  </div>

  <div class="status-row">
    <span class="status-badge" [class.active]="drawer.opened()">
      {{ drawer.opened() ? 'open' : 'closed' }}
    </span>
  </div>`,
    },
    {
      title: 'Direction — All Four Sides',
      subtitle:
        'Change <code>[position]</code> to <code>left</code>, <code>right</code>, <code>top</code>, or <code>bottom</code>. ' +
        'The directives only set CSS classes — the consumer provides the transition.',
      imports: ['CngxDrawer', 'CngxDrawerPanel', 'CngxDrawerContent'],
      template: `
  <div class="filter-row">
    <span class="filter-label">Position:</span>
    @for (d of directions; track d) {
      <button class="chip" [class.chip--active]="direction() === d"
              (click)="direction.set(d)">{{ d }}</button>
    }
  </div>

  <div cngxDrawer #dirDrawer="cngxDrawer" class="drawer-container drawer-container--bordered">
    <button class="sort-btn" (click)="dirDrawer.toggle()">
      Toggle {{ direction() }} drawer
    </button>

    <div class="drawer-layout drawer-layout--relative">
      <aside [cngxDrawerPanel]="dirDrawer" [position]="direction()"
             [enabled]="dirDrawer.opened()"
             class="drawer-panel drawer-panel--direction"
             [class.drawer-panel--horizontal]="direction() === 'left' || direction() === 'right'"
             [class.drawer-panel--vertical]="direction() === 'top' || direction() === 'bottom'">
        <div class="drawer-panel-content">
          <strong>{{ direction() }} panel</strong>
          <button class="sort-btn" (click)="dirDrawer.close()">Close</button>
        </div>
      </aside>

      <main [cngxDrawerContent]="dirDrawer" class="drawer-main drawer-main--tall">
        <p>Content shifts when the drawer opens. Direction: <strong>{{ direction() }}</strong></p>
      </main>
    </div>
  </div>`,
    },
    {
      title: 'Mode — Over / Push / Side',
      subtitle:
        '<code>[mode]</code> controls how the panel interacts with content. ' +
        '<strong>over</strong> (default) overlays content. ' +
        '<strong>push</strong> pushes content aside. ' +
        '<strong>side</strong> is always visible — no toggle needed.',
      imports: ['CngxDrawer', 'CngxDrawerPanel', 'CngxDrawerContent'],
      template: `
  <div class="filter-row">
    <span class="filter-label">Mode:</span>
    @for (m of modes; track m) {
      <button class="chip" [class.chip--active]="mode() === m"
              (click)="mode.set(m)">{{ m }}</button>
    }
  </div>

  <div cngxDrawer #modeDrawer="cngxDrawer" class="drawer-container drawer-container--bordered">
    @if (mode() !== 'side') {
      <button class="sort-btn" (click)="modeDrawer.toggle()">
        Toggle {{ mode() }} drawer
      </button>
    }

    <div class="drawer-layout drawer-layout--relative"
         [class.drawer-layout--push]="mode() === 'push' || mode() === 'side'">
      <aside [cngxDrawerPanel]="modeDrawer" position="left" [mode]="mode()"
             [enabled]="modeDrawer.opened() && mode() !== 'side'"
             class="drawer-panel"
             [class.drawer-panel--static]="mode() === 'push' || mode() === 'side'">
        <div class="drawer-panel-content">
          <strong>{{ mode() }} panel</strong>
          @if (mode() !== 'side') {
            <button class="sort-btn" (click)="modeDrawer.close()">Close</button>
          }
        </div>
      </aside>

      <main [cngxDrawerContent]="modeDrawer" class="drawer-main drawer-main--tall">
        <p>Mode: <strong>{{ mode() }}</strong></p>
        @if (mode() === 'side') {
          <p>Always visible — no toggle button needed.</p>
        } @else if (mode() === 'push') {
          <p>Content shifts when the drawer opens.</p>
        } @else {
          <p>Panel overlays content.</p>
        }
      </main>
    </div>
  </div>`,
    },
    {
      title: 'Controlled Mode',
      subtitle:
        'Bind <code>[cngxDrawerOpened]</code> to a signal for controlled state. The parent owns the truth — ' +
        'internal <code>toggle()</code> still emits <code>(openedChange)</code> but the controlled input wins.',
      imports: ['CngxDrawer', 'CngxDrawerPanel'],
      template: `
  <div class="button-row">
    <button class="sort-btn" (click)="controlledOpen.set(!controlledOpen())">
      External toggle: {{ controlledOpen() ? 'open' : 'closed' }}
    </button>
  </div>

  <div cngxDrawer #ctrlDrawer="cngxDrawer"
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
  </div>

  <div class="status-row">
    <span class="status-badge" [class.active]="controlledOpen()">
      controlledOpen: {{ controlledOpen() }}
    </span>
  </div>`,
    },
    {
      title: 'Events — openedChange & closed',
      subtitle:
        '<code>(openedChange)</code> emits on every state change. <code>(closed)</code> emits only on close. ' +
        'Both are useful for side effects like analytics or saving state.',
      imports: ['CngxDrawer', 'CngxDrawerPanel'],
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
    },
    {
      title: 'Pattern — Consumer Wiring',
      subtitle:
        'The drawer system is fully headless. Directives set CSS classes; the consumer styles them. ' +
        '<code>CngxAriaExpanded</code> and <code>CngxFocusTrap</code> are wired by the consumer — not auto-injected.',
      template: `
  <pre class="code-block"><code>&lt;div cngxDrawer #drawer="cngxDrawer"&gt;
  &lt;!-- Consumer wires CngxAriaExpanded on the trigger --&gt;
  &lt;button [cngxAriaExpanded]="drawer.opened()"
          [controls]="'sidebar'" (click)="drawer.toggle()"&gt;
    Menu
  &lt;/button&gt;

  &lt;!-- CngxFocusTrap is a hostDirective — consumer binds [enabled] --&gt;
  &lt;nav [cngxDrawerPanel]="drawer" position="left"
       [enabled]="drawer.opened()" [autoFocus]="true"
       id="sidebar" role="navigation"&gt;
    ...
  &lt;/nav&gt;

  &lt;!-- Optional: content shifts via CSS --&gt;
  &lt;main [cngxDrawerContent]="drawer"&gt;...&lt;/main&gt;

  &lt;!-- Optional: backdrop is pure CSS --&gt;
  &lt;div class="backdrop" [class.visible]="drawer.opened()"
       (click)="drawer.close()"&gt;&lt;/div&gt;
&lt;/div&gt;</code></pre>`,
    },
  ],
};
