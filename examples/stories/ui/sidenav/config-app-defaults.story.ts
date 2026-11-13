import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'provideSidenavConfigAt: config app defaults',
  subtitle:
    'One <code>provideSidenavConfigAt(...)</code> in <code>viewProviders</code> moves the sidenav defaults for everything below it: <code>withSidenavDimensions</code> sets the width and the resize bounds, <code>withSidenavShortcut</code> the toggle combo, <code>withSidenavLabels</code> the accessible name of the resize handle. The rail binds none of <code>[width]</code>, <code>[minWidth]</code>, <code>[maxWidth]</code>, <code>[shortcut]</code> or <code>[resizeLabel]</code>.',
  description:
    'The rail starts at the configured 220px. Drag the handle on its edge, or focus it and press the arrow keys (Home / End jump to the bounds): the width stops at the configured 160px and 320px instead of the library 120px / 600px. Press <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>B</kbd> to hide and show the rail: it is docked (<code>mode="side"</code>) with <code>collapsedAs="hidden"</code>, so collapsing takes it to zero width and the content reflows. A per-instance input still wins over each of these keys; <code>provideSidenavConfig(...)</code> sets the same features app-wide at bootstrap.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxSidenav', 'CngxSidenavLayout'],
  moduleImports: [
    "import { CngxSidenavLayout, CngxSidenav, CngxSidenavContent, injectSidenavConfig, injectSidenavLabels, provideSidenavConfigAt, withSidenavDimensions, withSidenavLabels, withSidenavShortcut } from '@cngx/ui/sidenav';",
    "import { CngxNavHeader, CngxNavLink } from '@cngx/common/interactive';",
  ],
  imports: [
    'CngxSidenavLayout',
    'CngxSidenav',
    'CngxSidenavContent',
    'CngxNavHeader',
    'CngxNavLink',
  ],
  viewProviders: [
    `provideSidenavConfigAt(
      withSidenavDimensions({ width: '220px', minWidth: '160px', maxWidth: '320px' }),
      withSidenavShortcut('mod+b'),
      withSidenavLabels({ resizeHandle: 'Resize project list' }),
    )`,
  ],
  setup: `protected readonly navCollapsed = signal(false);
  protected readonly projects = ['Website relaunch', 'Mobile app', 'Data platform'];
  protected readonly current = signal('Website relaunch');`,
  template: `  <cngx-sidenav-layout class="demo-sidenav__container demo-sidenav__container--short">
    <cngx-sidenav
      #nav="cngxSidenav"
      position="start"
      mode="side"
      collapsedAs="hidden"
      [resizable]="true"
      [(collapsed)]="navCollapsed"
      ariaLabel="Projects"
    >
      <cngx-nav-header class="demo-sidenav__header">Projects</cngx-nav-header>
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
      <span class="event-value">{{ sidenavConfig.shortcut }}, rail {{ navCollapsed() ? 'hidden' : 'shown' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Handle name</span>
      <span class="event-value">{{ sidenavLabels().resizeHandle }}</span>
    </div>
  </div>`,
};
