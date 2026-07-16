import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSidenavRouterSync: deep-linkable overlay',
  subtitle:
    'Add <code>[cngxSidenavRouterSync]</code> to an <code>over</code>-mode sidenav and its open state deep-links to <code>?nav=open</code>. Opening writes the param, an initial <code>?nav=open</code> hydrates it open, closing removes it, and browser back/forward re-hydrates. The directive reaches the rail through the <code>CNGX_SIDENAV</code> contract token and calls the shared <code>injectQueryParamSync</code> kernel.',
  description:
    'Open the menu, then check the URL for ?nav=open - share or reload that URL to reopen the menu. The param default cascades: per-instance [param] wins, then withSidenavRouterSync({ param }), then the "nav" literal.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['integration'],
  apiComponents: ['CngxSidenavRouterSync', 'CngxSidenav'],
  moduleImports: [
    "import { signal } from '@angular/core';",
    "import { CngxSidenavLayout, CngxSidenav, CngxSidenavContent, CngxSidenavHeader, CngxSidenavRouterSync } from '@cngx/ui';",
    "import { CngxNavLink } from '@cngx/common';",
    "import { CngxTag } from '@cngx/common/display';",
  ],
  imports: [
    'CngxSidenavLayout',
    'CngxSidenav',
    'CngxSidenavContent',
    'CngxSidenavHeader',
    'CngxSidenavRouterSync',
    'CngxNavLink',
    'CngxTag',
  ],
  setup: `protected readonly navOpen = signal(false);`,
  templateChromeBefore: `
  <p style="margin:0 0 0.75rem; color:var(--cngx-text-muted, #71717a)">
    Open the menu, then check the URL for <code>?nav=open</code>. Reload or share it to restore the open menu.
  </p>`,
  template: `
  <cngx-sidenav-layout style="height:320px; border:1px solid var(--cngx-border, #e4e4e7); border-radius:var(--cngx-radius, 0.5rem); overflow:hidden">
    <cngx-sidenav id="cngx-demo-sidenav"
                  cngxSidenavRouterSync
                  position="start"
                  mode="over"
                  ariaLabel="Demo navigation"
                  [(opened)]="navOpen">
      <cngx-sidenav-header>Menu</cngx-sidenav-header>
      @for (item of ['Dashboard', 'Reports', 'Settings']; track item) {
        <a cngxNavLink [active]="item === 'Dashboard'">{{ item }}</a>
      }
    </cngx-sidenav>
    <cngx-sidenav-content style="padding:1rem; display:flex; gap:0.75rem; align-items:center">
      <button type="button"
              class="chip"
              [attr.aria-expanded]="navOpen()"
              aria-controls="cngx-demo-sidenav"
              (click)="navOpen.set(!navOpen())">
        {{ navOpen() ? 'Close menu' : 'Open menu' }}
      </button>
      <cngx-tag [color]="navOpen() ? 'success' : 'neutral'">
        nav: {{ navOpen() ? 'open' : 'closed' }}
      </cngx-tag>
    </cngx-sidenav-content>
  </cngx-sidenav-layout>`,
};
