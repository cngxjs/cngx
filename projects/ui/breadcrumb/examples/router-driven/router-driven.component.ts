import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import {
  CngxBreadcrumb,
  CngxBreadcrumbItem,
  CngxBreadcrumbSeparator,
} from '@cngx/common/interactive';
import { CngxBreadcrumbSiblings, CngxBreadcrumbSiblingsRouterSync } from '@cngx/ui/breadcrumb';

// Re-export forces compodocx to ship app.config.ts (and, transitively,
// demo-routes.ts) in the StackBlitz manifest - the router lives there.
export { appConfig } from './app.config';

/**
 * Router-driven sibling dropdown over a nested route tree.
 *
 * A hand-composed `cngxBreadcrumb` trail ends in a
 * `<cngx-breadcrumb-siblings cngxRouterSync [depth]="1">`: the directive
 * reads the activated route tree, enumerates the children of the active
 * route's parent (Munich / Berlin / Hamburg under `eu`), and marks the
 * active one `aria-current="page"`. No `[siblings]` input - the set is
 * derived from the route through the `CNGX_BREADCRUMB_SIBLINGS_SOURCE`
 * seam (Pillar 1).
 *
 * - **Navigate with the routerLink switchers.** The sibling rows the
 *   dropdown renders are native `<a href>` (SPA-link support is a later
 *   release), so use the switchers below - or browser back/forward - to
 *   move between cities and watch the dropdown's current marker follow.
 * - **Derivation, not management.** Every navigation re-derives the set;
 *   a same-shape move keeps the previous `siblings()` reference via a
 *   shape-based `equal`, so it never cascades.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CngxBreadcrumb,
    CngxBreadcrumbItem,
    CngxBreadcrumbSeparator,
    CngxBreadcrumbSiblings,
    CngxBreadcrumbSiblingsRouterSync,
    RouterLink,
    RouterOutlet,
  ],
  styleUrls: ['./router-driven.component.css'],
  template: `
    <p style="opacity: 0.8; font-size: 0.875rem; margin-top: 0">
      Switch city (real <code>routerLink</code> navigation), then open the
      chevron: the sibling set is derived from the route and the active city
      is marked <code>aria-current</code>.
    </p>

    <nav class="switcher" aria-label="Jump to city">
      <a routerLink="/eu/munich">Munich</a>
      <a routerLink="/eu/berlin">Berlin</a>
      <a routerLink="/eu/hamburg">Hamburg</a>
    </nav>

    <nav cngxBreadcrumb class="cngx-breadcrumb">
      <ol>
        <li><a cngxBreadcrumbItem routerLink="/">Home</a></li>
        <li cngxBreadcrumbSeparator>/</li>
        <li>
          <a cngxBreadcrumbItem>Region EU</a>
          <cngx-breadcrumb-siblings cngxRouterSync [depth]="1" />
        </li>
      </ol>
    </nav>

    <div class="outlet">
      <router-outlet></router-outlet>
    </div>
  `,
})
export class RouterDrivenSiblingsExample {}
