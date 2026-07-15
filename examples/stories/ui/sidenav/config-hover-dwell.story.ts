import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSidenav: configured vs per-instance hover dwell',
  subtitle: 'The mini expand-on-hover dwell resolves in three tiers: a per-instance <code>[enterDelay]</code> binding beats a <code>withSidenavHoverDwell(...)</code> cascade default, which beats the atom literal (120ms). Both rails below sit under one <code>provideSidenavConfigAt(withSidenavHoverDwell({ enterDelay: 250 }))</code> scope - the left rail inherits that 250ms dwell, the right rail overrides it with <code>[enterDelay]="600"</code>.',
  description: 'Rest on the left rail: it expands after ~250ms (the scoped cascade default). Rest on the right rail: it waits ~600ms (its per-instance binding wins over the same scope). A quick sweep across either leaves it collapsed.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['behavior', 'composition'],
  apiComponents: ['CngxSidenav'],
  moduleImports: [
    'import { CngxSidenavLayout, CngxSidenav, CngxSidenavContent, CngxSidenavHeader, provideSidenavConfigAt, withSidenavHoverDwell } from \'@cngx/ui\';',
    'import { CngxNavLink, CngxNavLabel } from \'@cngx/common\';',
  ],
  imports: ['CngxSidenavLayout', 'CngxSidenav', 'CngxSidenavContent', 'CngxSidenavHeader', 'CngxNavLink', 'CngxNavLabel'],
  viewProviders: ['provideSidenavConfigAt(withSidenavHoverDwell({ enterDelay: 250 }))'],
  template: `
  <cngx-sidenav-layout class="demo-sidenav__container">
    <cngx-sidenav #navConfig="cngxSidenav" position="start" mode="mini" width="240px">
      <cngx-sidenav-header class="demo-sidenav__header">Config</cngx-sidenav-header>
      <span cngxNavLabel class="demo-sidenav__label">Scoped 250ms</span>
      @for (item of [['Dashboard', '/dashboard'], ['Inbox', '/inbox']]; track item[1]) {
        <a cngxNavLink class="demo-sidenav__link" [active]="false"
           (click)="$event.preventDefault()">{{ item[0] }}</a>
      }
    </cngx-sidenav>

    <cngx-sidenav-content class="demo-sidenav__content">
      <h3 class="demo-sidenav__content-title">Three-tier dwell</h3>
      <p class="demo-sidenav__content-hint">
        Both rails share one <code>provideSidenavConfigAt(withSidenavHoverDwell(&#123; enterDelay: 250 &#125;))</code>
        scope. The left rail inherits 250ms; the right rail binds <code>[enterDelay]="600"</code> to win over it.
      </p>
    </cngx-sidenav-content>

    <cngx-sidenav #navOverride="cngxSidenav" position="end" mode="mini" width="240px" [enterDelay]="600">
      <cngx-sidenav-header class="demo-sidenav__header">Override</cngx-sidenav-header>
      <span cngxNavLabel class="demo-sidenav__label">Instance 600ms</span>
      @for (item of [['Settings', '/settings'], ['Help', '/help']]; track item[1]) {
        <a cngxNavLink class="demo-sidenav__link" [active]="false"
           (click)="$event.preventDefault()">{{ item[0] }}</a>
      }
    </cngx-sidenav>
  </cngx-sidenav-layout>`,
  templateChromeBefore: `<p class="demo-sidenav__content-hint" style="margin-bottom: 0.75rem;">
    Rest on the left rail (~250ms, scoped default) or the right rail (~600ms, per-instance override). A quick sweep leaves either collapsed.
  </p>`,
  templateChrome: `<div class="status-row" style="margin-top: 0.5rem; gap: 0.5rem;">
    <span class="status-badge" [class.active]="navConfig.expanded()">left (250ms): {{ navConfig.expanded() ? 'expanded' : 'collapsed' }}</span>
    <span class="status-badge" [class.active]="navOverride.expanded()">right (600ms): {{ navOverride.expanded() ? 'expanded' : 'collapsed' }}</span>
  </div>`,
};
