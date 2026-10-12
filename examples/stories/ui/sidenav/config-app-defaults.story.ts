import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'provideSidenavConfigAt: config app defaults',
  subtitle:
    'One <code>provideSidenavConfigAt(...)</code> in <code>viewProviders</code> moves the sidenav defaults for everything below it: <code>withSidenavDimensions</code> sets the width and the resize bounds, <code>withSidenavShortcut</code> the toggle combo, <code>withSidenavLabels</code> the accessible name of the resize handle. The rail binds none of <code>[width]</code>, <code>[minWidth]</code>, <code>[maxWidth]</code>, <code>[shortcut]</code> or <code>[resizeLabel]</code>.',
  description:
    'The rail starts at the configured 220px. Drag the handle on its edge, or focus it and press the arrow keys (Home / End jump to the bounds): the width stops at the configured 160px and 320px instead of the library 120px / 600px. Press <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>B</kbd> to close and reopen the rail; it runs in <code>push</code> mode because <code>close()</code> is a no-op for the always-visible <code>side</code> and <code>mini</code> rails. A per-instance input still wins over each of these keys; <code>provideSidenavConfig(...)</code> sets the same features app-wide at bootstrap.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxSidenav', 'CngxSidenavLayout'],
  moduleImports: [
    "import { CngxSidenavLayout, CngxSidenav, CngxSidenavContent, CngxSidenavHeader, injectSidenavConfig, injectSidenavLabels, provideSidenavConfigAt, withSidenavDimensions, withSidenavLabels, withSidenavShortcut } from '@cngx/ui/sidenav';",
    "import { CngxNavLink } from '@cngx/common/interactive';",
  ],
  imports: [
    'CngxSidenavLayout',
    'CngxSidenav',
    'CngxSidenavContent',
    'CngxSidenavHeader',
    'CngxNavLink',
  ],
  viewProviders: [
    `provideSidenavConfigAt(
      withSidenavDimensions({ width: '220px', minWidth: '160px', maxWidth: '320px' }),
      withSidenavShortcut('mod+b'),
      withSidenavLabels({ resizeHandle: 'Resize project list' }),
    )`,
  ],
  setup: `protected readonly navOpen = signal(true);
  protected readonly projects = ['Website relaunch', 'Mobile app', 'Data platform'];
  protected readonly current = signal('Website relaunch');`,
  template: `  <cngx-sidenav-layout class="demo-sidenav__container demo-sidenav__container--short">
    <cngx-sidenav
      #nav="cngxSidenav"
      position="start"
      mode="push"
      [resizable]="true"
      [(opened)]="navOpen"
      ariaLabel="Projects"
    >
      <cngx-sidenav-header class="demo-sidenav__header">Projects</cngx-sidenav-header>
      @for (project of projects; track project) {
        <a
          cngxNavLink
          class="demo-sidenav__link"
          [active]="current() === project"
          (click)="current.set(project); $event.preventDefault()"
        >
          {{ project }}
        </a>
      }
    </cngx-sidenav>
    <cngx-sidenav-content class="demo-sidenav__content">
      <h3 class="demo-sidenav__content-title demo-sidenav__content-title--small">{{ current() }}</h3>
      <p class="demo-sidenav__content-hint">
        Width, resize bounds, shortcut and handle label all come from the scope's config.
      </p>
    </cngx-sidenav-content>
  </cngx-sidenav-layout>`,
  setupChrome: `protected readonly sidenavConfig = injectSidenavConfig();
  protected readonly sidenavLabels = injectSidenavLabels();`,
  templateChrome: `<div class="event-grid">
    <div class="event-row">
      <span class="event-label">Width</span>
      <span class="event-value">{{ nav.width() }} (configured {{ sidenavConfig.dimensions?.width }}, bounds {{ sidenavConfig.dimensions?.minWidth }} to {{ sidenavConfig.dimensions?.maxWidth }})</span>
    </div>
    <div class="event-row">
      <span class="event-label">Shortcut</span>
      <span class="event-value">{{ sidenavConfig.shortcut }}, rail {{ nav.opened() ? 'open' : 'closed' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Handle name</span>
      <span class="event-value">{{ sidenavLabels().resizeHandle }}</span>
    </div>
  </div>`,
};
