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
import { type ActivatedRouteSnapshot, NavigationEnd, type Route, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { CNGX_BREADCRUMB_SIBLINGS_SOURCE } from './breadcrumb-siblings-source.token';
import type { CngxBreadcrumbSiblingsSource } from './breadcrumb-siblings-source.token';
import type { CngxBreadcrumbSibling } from './breadcrumb.types';

/**
 * Positional shape equality for two sibling sets. The router source maps a
 * fresh sibling literal per navigation, so reference equality (`Object.is`)
 * would treat every `NavigationEnd` as a change; comparing
 * `label`/`href`/`current` lets a same-shape navigation keep the previous
 * signal reference and stops it cascading the dropdown
 * (reference_signal_architecture Equality Rule). Mirrors `crumbsEqual`.
 *
 * `current` is compared because the same set of siblings with a different
 * active member is a genuine change - the `aria-current` marker moves.
 */
function siblingsEqual(
  a: readonly CngxBreadcrumbSibling[],
  b: readonly CngxBreadcrumbSibling[],
): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i].label !== b[i].label || a[i].href !== b[i].href || !!a[i].current !== !!b[i].current) {
      return false;
    }
  }
  return true;
}

/**
 * Opt-in router mode for {@link CngxBreadcrumbSiblings}. Add `cngxRouterSync`
 * to a `<cngx-breadcrumb-siblings>` and its rows are derived from the activated
 * route tree: the sibling routes at `[depth]` (the other children of that
 * level's parent) whose `data[dataKey]` is a non-empty string each become a
 * row, and the active child is marked `current`. The dropdown reads the set
 * through the {@link CNGX_BREADCRUMB_SIBLINGS_SOURCE} seam (provided here via
 * `useExisting`), so the directive never writes the component's `[siblings]`
 * input and never injects the concrete component class - decompose-clean
 * (Pillar 1; reference_atomic_decompose rule 4).
 *
 * The navigation stream converts to a signal at the boundary via `toSignal`
 * (Pillar 1, no raw subscription); the set is a `computed` over that trigger,
 * `depth`, and `dataKey`, carrying a shape-based `equal` so a same-shape
 * navigation does not cascade. `Router` is optional - without it the directive
 * logs a dev warning and stays an empty source.
 *
 * ```html
 * <cngx-breadcrumb-siblings cngxRouterSync [depth]="1" />
 * ```
 *
 * ```typescript
 * // Route config supplies the sibling labels:
 * { path: 'eu', data: { breadcrumb: 'Region EU' }, children: [
 *   { path: 'munich', data: { breadcrumb: 'Munich' } },
 *   { path: 'berlin', data: { breadcrumb: 'Berlin' } },
 * ] }
 * ```
 *
 * @category ui/breadcrumb
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/breadcrumb/breadcrumb-siblings-router-sync.directive.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumbSiblings, CngxBreadcrumbSiblingsSource
 */
@Directive({
  selector: 'cngx-breadcrumb-siblings[cngxRouterSync]',
  exportAs: 'cngxBreadcrumbSiblingsRouterSync',
  standalone: true,
  providers: [
    { provide: CNGX_BREADCRUMB_SIBLINGS_SOURCE, useExisting: CngxBreadcrumbSiblingsRouterSync },
  ],
})
export class CngxBreadcrumbSiblingsRouterSync implements CngxBreadcrumbSiblingsSource {
  private readonly router = inject(Router, { optional: true });

  /**
   * Index into the activated route chain (root's first real child is `0`)
   * whose siblings are listed. `0` lists the top-level routes; `1` lists the
   * children of the first-level active route, and so on. The directive owns
   * this keying as its own input (mirrors the trail sync owning `dataKey`).
   */
  readonly depth = input<number>(0);

  /**
   * Route `data` key the sibling labels are read from. Defaults to
   * `'breadcrumb'`; override to read a different key.
   */
  readonly dataKey = input<string>('breadcrumb');

  /** The router-derived siblings. Wins over the component's `[siblings]` input. */
  readonly siblings: Signal<readonly CngxBreadcrumbSibling[]>;

  constructor() {
    const router = this.router;
    if (!router) {
      afterNextRender(() => {
        console.warn(
          'CngxBreadcrumbSiblingsRouterSync: no Router available - directive is a no-op. ' +
            'Provide @angular/router via provideRouter(...) to enable router-driven siblings.',
        );
      });
      this.siblings = signal<readonly CngxBreadcrumbSibling[]>([]).asReadonly();
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
    // Derive the set from the navigation trigger, depth, and dataKey - all
    // reactive, so a runtime depth/dataKey change re-reads the tree too. The
    // route snapshot is read imperatively per recompute; navEnd is the tracked
    // trigger (Pillar 1).
    this.siblings = computed(
      () => {
        navEnd();
        return buildSiblings(router, this.depth(), this.dataKey());
      },
      { equal: siblingsEqual },
    );
  }
}

/**
 * Enumerates the sibling routes at `depth` in the activated route chain: the
 * children of that level's parent (or the root config at depth 0) whose
 * `data[dataKey]` is a non-empty string, marking the active child `current`.
 * Sibling configs come from the static route configuration, not the activated
 * snapshot (which only holds the one active child), so the whole set of
 * alternatives is visible. Duplicate hrefs are collapsed like `buildCrumbs`.
 */
function buildSiblings(
  router: Router,
  depth: number,
  dataKey: string,
): readonly CngxBreadcrumbSibling[] {
  // Active chain of real routes, skipping the componentless root.
  const chain: ActivatedRouteSnapshot[] = [];
  let route: ActivatedRouteSnapshot | null = router.routerState.snapshot.root.firstChild;
  while (route) {
    chain.push(route);
    route = route.firstChild;
  }

  const target = depth >= 0 ? chain[depth] : undefined;
  const targetConfig: Route | null = target?.routeConfig ?? null;

  let siblingConfigs: readonly Route[];
  let prefix = '';
  if (depth <= 0) {
    siblingConfigs = router.config;
  } else {
    const parent = chain[depth - 1];
    siblingConfigs = parent?.routeConfig?.children ?? [];
    for (let i = 0; i < depth && i < chain.length; i++) {
      const seg = chain[i].url.map((s) => s.path).join('/');
      if (seg) {
        prefix += `/${seg}`;
      }
    }
  }

  const out: CngxBreadcrumbSibling[] = [];
  for (const cfg of siblingConfigs) {
    const raw: unknown = cfg.data?.[dataKey];
    if (typeof raw !== 'string' || raw.length === 0) {
      continue;
    }
    const seg = cfg.path ?? '';
    const href = seg ? `${prefix}/${seg}` : prefix || '/';
    const current = targetConfig !== null && cfg === targetConfig;
    const prev = out.at(-1);
    if (prev?.href === href) {
      // A path-less sibling reuses the parent URL; collapse it - deepest label
      // wins, current stays set if either matched - so the set never emits a
      // duplicate href (the dropdown's @for track would otherwise collide).
      out[out.length - 1] = { label: raw, href, current: prev.current ?? current };
    } else {
      out.push({ label: raw, href, current });
    }
  }
  return out;
}
