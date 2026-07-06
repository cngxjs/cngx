import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  inject,
  input,
  signal,
  type Signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { type ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { CNGX_BREADCRUMB_ITEMS_SOURCE } from './breadcrumb-items-source.token';
import type { CngxBreadcrumbItemsSource } from './breadcrumb-items-source.token';
import { injectBreadcrumbConfig } from './config/inject-breadcrumb-config';
import type { CngxBreadcrumbCrumb } from './breadcrumb.types';

/**
 * Positional shape equality for two crumb trails. The router source maps a
 * fresh crumb literal per navigation, so reference equality (`Object.is`)
 * would treat every `NavigationEnd` as a change; comparing `label`/`href`
 * lets a same-shape navigation keep the previous signal reference and stops
 * it cascading the bar (reference_signal_architecture Equality Rule).
 *
 * The router source emits `href` only, so `label`/`href` fully describe a
 * crumb's identity here. When SPA-link emission lands, its equality is defined
 * alongside it.
 */
function crumbsEqual(
  a: readonly CngxBreadcrumbCrumb[],
  b: readonly CngxBreadcrumbCrumb[],
): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i].label !== b[i].label || a[i].href !== b[i].href) {
      return false;
    }
  }
  return true;
}

/**
 * Opt-in router mode for {@link CngxBreadcrumbBar}. Add `routerSync` to a
 * `<cngx-breadcrumb>` and the trail is derived from the activated route tree -
 * every route whose `data[dataKey]` (default `data.breadcrumb`) is a non-empty
 * string contributes a crumb, terminal marking follows from position. The bar
 * reads the trail through the {@link CNGX_BREADCRUMB_ITEMS_SOURCE} seam
 * (provided here via `useExisting`), so the directive never writes the bar's
 * `[items]` input and never injects the concrete bar class - decompose-clean
 * (Pillar 1; reference_atomic_decompose rule 4).
 *
 * The navigation stream converts to a signal at the boundary via `toSignal`
 * (Pillar 1, no raw subscription); the trail is a `computed` over that trigger
 * and `dataKey`, carrying a shape-based `equal` so a same-shape navigation does
 * not cascade the trail. `Router` is optional - without it the directive logs a
 * dev warning and stays an empty source.
 *
 * ```html
 * <cngx-breadcrumb cngxRouterSync />
 * ```
 *
 * ```typescript
 * // Route config supplies the crumb labels:
 * { path: 'catalog', data: { breadcrumb: 'Catalog' }, children: [
 *   { path: 'books', data: { breadcrumb: 'Books' } },
 * ] }
 * ```
 *
 * @category ui/breadcrumb
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/breadcrumb/breadcrumb-router-sync.directive.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumbBar, CngxBreadcrumbItemsSource
 * <example-url>http://localhost:4200/#/ui/breadcrumb/router/router-driven</example-url>
 */
@Directive({
  selector: 'cngx-breadcrumb[cngxRouterSync]',
  exportAs: 'cngxBreadcrumbRouterSync',
  standalone: true,
  providers: [
    { provide: CNGX_BREADCRUMB_ITEMS_SOURCE, useExisting: CngxBreadcrumbRouterSync },
  ],
})
export class CngxBreadcrumbRouterSync implements CngxBreadcrumbItemsSource {
  private readonly router = inject(Router, { optional: true });
  private readonly cfg = injectBreadcrumbConfig();

  /**
   * Route `data` key the trail is read from. Falls back through the config
   * cascade to `'breadcrumb'`; override per-instance to read a different key
   * (mirrors the sibling's `paramName`).
   */
  readonly dataKey = input<string>(this.cfg.router?.dataKey ?? 'breadcrumb');

  /** The router-derived trail. Wins over the bar's `[items]` input. */
  readonly crumbs: Signal<readonly CngxBreadcrumbCrumb[]>;

  constructor() {
    const router = this.router;
    if (!router) {
      afterNextRender(() => {
        console.warn(
          'CngxBreadcrumbRouterSync: no Router available - directive is a no-op. ' +
            'Provide @angular/router via provideRouter(...) to enable router-driven crumbs.',
        );
      });
      this.crumbs = signal<readonly CngxBreadcrumbCrumb[]>([]).asReadonly();
      return;
    }

    const destroyRef = inject(DestroyRef);
    const navEnd = toSignal(
      router.events.pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(destroyRef),
      ),
      { initialValue: null },
    );
    // Derive the trail from the navigation trigger and dataKey - both reactive,
    // so a runtime dataKey change re-reads the tree too. The route snapshot is
    // read imperatively per recompute; navEnd is the tracked trigger (Pillar 1).
    this.crumbs = computed(() => {
      navEnd();
      return buildCrumbs(router, this.dataKey());
    }, { equal: crumbsEqual });
  }
}

/**
 * Walks the activated route tree from the root down the firstChild chain,
 * accumulating the URL and emitting one crumb per route whose `data[dataKey]`
 * is a non-empty string.
 */
function buildCrumbs(router: Router, dataKey: string): readonly CngxBreadcrumbCrumb[] {
  const crumbs: CngxBreadcrumbCrumb[] = [];
  let route: ActivatedRouteSnapshot | null = router.routerState.snapshot.root;
  let url = '';
  while (route) {
    const segment = route.url.map((s) => s.path).join('/');
    if (segment) {
      url += `/${segment}`;
    }
    const raw: unknown = route.data[dataKey];
    if (typeof raw === 'string' && raw.length > 0) {
      const href = url || '/';
      const prev = crumbs[crumbs.length - 1];
      if (prev?.href === href) {
        // A segment-less (componentless) route carrying a breadcrumb reuses the
        // parent URL; collapse it into one crumb - deepest label wins - so the
        // trail never emits a duplicate href, which is the bar's @for track key
        // and would throw NG0955 on a duplicate.
        crumbs[crumbs.length - 1] = { label: raw, href };
      } else {
        crumbs.push({ label: raw, href });
      }
    }
    route = route.firstChild;
  }
  return crumbs;
}
