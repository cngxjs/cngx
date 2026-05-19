import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Material Theming -- Light vs Dark',
  subtitle: 'Both panels use the real <code>sidenav-theme.scss</code> mixin applied via <code>styles.scss</code>. The right panel sets <code>data-theme="dark"</code> which activates the dark M3 color tokens. No inline overrides -- purely Material Design 3 system colors.',
  description: 'Declarative sidebar organism with Material theming, nav atoms (links, groups, badges, labels), dual sidebar support, and responsive mode switching.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxSidenav',
    'CngxSidenavLayout',
    'CngxSidenavContent',
  ],
  moduleImports: [
    'import { CngxSidenavLayout, CngxSidenav, CngxSidenavContent, CngxSidenavHeader, CngxSidenavFooter } from \'@cngx/ui\';',
    'import { CngxNavLink, CngxNavLabel } from \'@cngx/common\';',
  ],
  imports: ['CngxSidenavLayout', 'CngxSidenav', 'CngxSidenavContent', 'CngxSidenavHeader', 'CngxSidenavFooter', 'CngxNavLink', 'CngxNavLabel'],
  template: `
  <div class="demo-sidenav__themes-grid">
    <!-- Light theme (M3 light via sidenav-theme.scss) -->
    <div>
      <div class="demo-sidenav__theme-label">Light (M3)</div>
      <cngx-sidenav-layout class="demo-sidenav__theme-panel">
        <cngx-sidenav position="start" [opened]="true" mode="side" width="170px">
          <cngx-sidenav-header>Workspace</cngx-sidenav-header>
          @for (item of ['Dashboard', 'Inbox', 'Calendar', 'Settings']; track item) {
            <a cngxNavLink [active]="item === 'Dashboard'">
              {{ item }}
            </a>
          }
          <cngx-sidenav-footer>v2.1</cngx-sidenav-footer>
        </cngx-sidenav>
        <cngx-sidenav-content style="padding: var(--cngx-sidenav-padding, 16px);">
          <p style="font-size: 0.8rem; margin: 0; opacity: 0.6;">M3 light surface tokens via <code>sidenav.theme($theme)</code>.</p>
        </cngx-sidenav-content>
      </cngx-sidenav-layout>
    </div>

    <!-- Dark theme (M3 dark via data-theme="dark") -->
    <div data-theme="dark" class="demo-sidenav__theme-panel--dark">
      <div class="demo-sidenav__theme-label demo-sidenav__theme-label--inset">Dark (M3)</div>
      <cngx-sidenav-layout class="demo-sidenav__theme-panel">
        <cngx-sidenav position="start" [opened]="true" mode="side" width="170px">
          <cngx-sidenav-header>Workspace</cngx-sidenav-header>
          @for (item of ['Dashboard', 'Inbox', 'Calendar', 'Settings']; track item) {
            <a cngxNavLink [active]="item === 'Dashboard'">
              {{ item }}
            </a>
          }
          <cngx-sidenav-footer>v2.1</cngx-sidenav-footer>
        </cngx-sidenav>
        <cngx-sidenav-content style="padding: var(--cngx-sidenav-padding, 16px);">
          <p style="font-size: 0.8rem; margin: 0; opacity: 0.6;">M3 dark surface tokens via <code>sidenav.theme($dark-theme)</code>.</p>
        </cngx-sidenav-content>
      </cngx-sidenav-layout>
    </div>
  </div>

  <pre class="code-block" style="margin-top: 1rem;"><code>@use '@angular/material' as mat;
@use '@cngx/ui/sidenav/sidenav-theme' as sidenav;

$theme: mat.define-theme((color: (primary: mat.$azure-palette)));
$dark:  mat.define-theme((color: (primary: mat.$azure-palette, theme-type: dark)));

html &#123;
  @include mat.all-component-themes($theme);
  @include sidenav.theme($theme);
&#125;

[data-theme='dark'] &#123;
  @include mat.all-component-colors($dark);
  @include sidenav.theme($dark);
&#125;</code></pre>`,
};
