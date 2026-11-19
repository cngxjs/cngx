import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSidenav: Collapsed state that survives a reload',
  subtitle:
    'Add <code>withSidenavPersistence(storageKey)</code> to the sidenav config and every rail keeps its <code>collapsed</code> state in <code>CNGX_SIDENAV_STORAGE</code> (the browser <code>localStorage</code> by default) under <code>&lt;storageKey&gt;:&lt;position&gt;</code>. The stored value seeds an unbound <code>collapsed</code> on construction; only a change is written, never the untouched default.',
  description:
    'Collapse the rail with the button, then reload the page: it comes back collapsed. The key is <code>cngx-demo-sidenav:start</code>, read from the static <code>position</code> attribute. A bound <code>[(collapsed)]</code> would win over the stored value and stay the consumer\'s; persistence then only writes.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxSidenav', 'CngxSidenavLayout'],
  moduleImports: [
    "import { CngxSidenavLayout, CngxSidenav, CngxSidenavContent, provideSidenavConfigAt, withSidenavPersistence } from '@cngx/ui/sidenav';",
    "import { CngxNavHeader, CngxNavLink } from '@cngx/common/interactive';",
    "import { CngxPanelTrigger } from '@cngx/common/layout';",
  ],
  imports: ['CngxSidenavLayout', 'CngxSidenav', 'CngxSidenavContent', 'CngxNavHeader', 'CngxNavLink', 'CngxPanelTrigger'],
  viewProviders: [`provideSidenavConfigAt(withSidenavPersistence('cngx-demo-sidenav'))`],
  template: `  <cngx-sidenav-layout>
    <cngx-sidenav #nav="cngxSidenav" position="start" mode="side" ariaLabel="Workspace">
      <cngx-nav-header>Workspace</cngx-nav-header>
      @for (item of ['Dashboard', 'Reports', 'Settings']; track item) {
        <a cngxNavLink [active]="item === 'Dashboard'" (click)="$event.preventDefault()">{{ item }}</a>
      }
    </cngx-sidenav>
    <cngx-sidenav-content style="padding: var(--cngx-space-md, 1rem)">
      <button type="button" [cngxPanelTrigger]="nav.panelTarget">Toggle navigation</button>
    </cngx-sidenav-content>
  </cngx-sidenav-layout>`,
  templateChrome: `<div class="event-grid">
    <div class="event-row">
      <span class="event-label">Rail</span>
      <span class="event-value">{{ nav.expanded() ? 'expanded' : 'collapsed' }}</span>
    </div>
  </div>`,
};
