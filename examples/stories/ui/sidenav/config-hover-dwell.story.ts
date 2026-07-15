import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSidenav: configured vs per-instance hover dwell',
  subtitle: 'The mini expand-on-hover dwell resolves in three tiers: a per-instance <code>[expandDelay]</code> binding beats a <code>withSidenavHoverDwell(...)</code> cascade default, which beats the atom literal (120ms). Both rails below sit under one <code>provideSidenavConfigAt(withSidenavHoverDwell({ enterDelay: 250 }))</code> scope - the top rail inherits that 250ms dwell, the bottom rail overrides it with <code>[expandDelay]="600"</code>.',
  description: 'Rest on the top rail: it expands after ~250ms (the scoped cascade default). Rest on the bottom rail: it waits ~600ms (its per-instance binding wins over the same scope). A quick sweep across either leaves it collapsed. Each mini rail shows first-letter initials until it expands - that is CngxNavLink + mini mode, not demo CSS.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['behavior', 'composition'],
  apiComponents: ['CngxSidenav'],
  moduleImports: [
    'import { CngxSidenavLayout, CngxSidenav, CngxSidenavContent, CngxSidenavHeader, provideSidenavConfigAt, withSidenavHoverDwell } from \'@cngx/ui\';',
    'import { CngxNavLink } from \'@cngx/common\';',
  ],
  imports: ['CngxSidenavLayout', 'CngxSidenav', 'CngxSidenavContent', 'CngxSidenavHeader', 'CngxNavLink'],
  viewProviders: ['provideSidenavConfigAt(withSidenavHoverDwell({ enterDelay: 250 }))'],
  template: `
  <cngx-sidenav-layout class="demo-sidenav__container" style="height: 180px;">
    <cngx-sidenav #navConfig="cngxSidenav" position="start" mode="mini" width="200px">
      <cngx-sidenav-header class="demo-sidenav__header">Config</cngx-sidenav-header>
      <a cngxNavLink class="demo-sidenav__link" [active]="false" (click)="$event.preventDefault()">Dashboard</a>
      <a cngxNavLink class="demo-sidenav__link" [active]="false" (click)="$event.preventDefault()">Inbox</a>
    </cngx-sidenav>
    <cngx-sidenav-content class="demo-sidenav__content">
      <h3 class="demo-sidenav__content-title--small" style="margin: 0 0 0.35rem;">Scoped default</h3>
      <p class="demo-sidenav__content-hint">Rest on the rail - it expands after ~250ms, the dwell this scope's <code>withSidenavHoverDwell</code> sets.</p>
    </cngx-sidenav-content>
  </cngx-sidenav-layout>

  <cngx-sidenav-layout class="demo-sidenav__container" style="height: 180px; margin-top: 1rem;">
    <cngx-sidenav #navOverride="cngxSidenav" position="start" mode="mini" width="200px" [expandDelay]="600">
      <cngx-sidenav-header class="demo-sidenav__header">Override</cngx-sidenav-header>
      <a cngxNavLink class="demo-sidenav__link" [active]="false" (click)="$event.preventDefault()">Settings</a>
      <a cngxNavLink class="demo-sidenav__link" [active]="false" (click)="$event.preventDefault()">Help</a>
    </cngx-sidenav>
    <cngx-sidenav-content class="demo-sidenav__content">
      <h3 class="demo-sidenav__content-title--small" style="margin: 0 0 0.35rem;">Per-instance override</h3>
      <p class="demo-sidenav__content-hint"><code>[expandDelay]="600"</code> wins over the same 250ms scope - this rail waits longer.</p>
    </cngx-sidenav-content>
  </cngx-sidenav-layout>`,
  templateChromeBefore: `<p class="demo-sidenav__content-hint" style="margin-bottom: 0.75rem;">
    Rest on the top rail (~250ms, scoped default) or the bottom rail (~600ms, per-instance override). A quick sweep leaves either collapsed.
  </p>`,
  templateChrome: `<div class="status-row" style="margin-top: 0.5rem; gap: 0.5rem;">
    <span class="status-badge" [class.active]="navConfig.expanded()">top (250ms): {{ navConfig.expanded() ? 'expanded' : 'collapsed' }}</span>
    <span class="status-badge" [class.active]="navOverride.expanded()">bottom (600ms): {{ navOverride.expanded() ? 'expanded' : 'collapsed' }}</span>
  </div>`,
};
