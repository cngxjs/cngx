import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSidenav: deliberate-dwell mini expand',
  subtitle: 'The <code>mini</code> rail expands on a debounced hover: sweeping the pointer across the 56px rail never expands it, only resting on it for ~120ms does. The dwell routes through the <code>CngxHoverIntent</code> atom composed as a host directive, so a pass-through on the way to the content area no longer flickers.',
  description: 'Sweep the pointer quickly across the rail - nothing happens. Rest on it briefly - it expands to full width; move away and it collapses. <code>[expandOnHover]="true"</code> is the on/off switch; the dwell timing is the atom default.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['behavior'],
  apiComponents: ['CngxSidenav'],
  moduleImports: [
    'import { CngxSidenavLayout, CngxSidenav, CngxSidenavContent, CngxSidenavHeader, CngxSidenavFooter } from \'@cngx/ui\';',
    'import { CngxNavLink, CngxNavLabel } from \'@cngx/common\';',
  ],
  imports: ['CngxSidenavLayout', 'CngxSidenav', 'CngxSidenavContent', 'CngxSidenavHeader', 'CngxSidenavFooter', 'CngxNavLink', 'CngxNavLabel'],
  setup: `protected readonly activeLink = signal('/dashboard');`,
  template: `
  <cngx-sidenav-layout class="demo-sidenav__container">
    <cngx-sidenav #nav="cngxSidenav" position="start" mode="mini" [expandOnHover]="true" width="240px">
      <cngx-sidenav-header class="demo-sidenav__header">
        Workspace
      </cngx-sidenav-header>

      <span cngxNavLabel class="demo-sidenav__label">Main</span>

      @for (item of [['Dashboard', '/dashboard'], ['Inbox', '/inbox'], ['Calendar', '/calendar']]; track item[1]) {
        <a cngxNavLink class="demo-sidenav__link" [class.demo-sidenav-active-link]="activeLink() === item[1]"
           [active]="activeLink() === item[1]"
           (click)="activeLink.set(item[1]); $event.preventDefault()">
          {{ item[0] }}
        </a>
      }

      <cngx-sidenav-footer class="demo-sidenav__footer">
        v2.1
      </cngx-sidenav-footer>
    </cngx-sidenav>

    <cngx-sidenav-content class="demo-sidenav__content">
      <h3 class="demo-sidenav__content-title">{{ activeLink().substring(1) || 'Dashboard' }}</h3>
      <p class="demo-sidenav__content-hint">
        Hover the rail on the left. A quick sweep leaves it collapsed; a brief rest expands it.
      </p>
    </cngx-sidenav-content>
  </cngx-sidenav-layout>`,
  templateChromeBefore: `<p class="demo-sidenav__content-hint" style="margin-bottom: 0.75rem;">
    Sweep the pointer across the rail without pausing - it stays collapsed. Rest on it for a moment - it expands.
  </p>`,
  templateChrome: `<div class="status-row" style="margin-top: 0.5rem;">
    <span class="status-badge" [class.active]="nav.expanded()">rail: {{ nav.expanded() ? 'expanded' : 'collapsed' }}</span>
  </div>`,
};
