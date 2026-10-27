import { afterNextRender, Directive, inject } from '@angular/core';
import { outputToObservable, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CngxRuntimeError, cngxDevWarn } from '@cngx/utils';

import { CNGX_TOC, type CngxTocContract } from './toc-token';

/**
 * Dev-warning emitted when `@angular/router` is absent. A deliberate small
 * local copy of the `@cngx/common/layout` kernel's warning rather than a
 * shared import - sharing would force the helper onto a `public-api.ts`, and
 * `warn*` matches no approved public-API prefix (same call the tabs and
 * sidenav sync directives make).
 *
 * @internal
 */
function warnRouterAbsent(selector: string, enables: string): void {
  if (!(typeof ngDevMode !== 'undefined' && ngDevMode)) {
    return;
  }
  cngxDevWarn(
    'CNGX3001',
    `[${selector}] no Router / ActivatedRoute available - directive is a no-op. ` +
      `Provide @angular/router via provideRouter(...) to enable ${enables}.`,
  );
}

/**
 * Deep-links a `CngxToc` into the URL fragment. Opt-in via
 * `[cngxTocRouterSync]` on the same host as `<cngx-toc>`: activating a link
 * writes `#<section-id>` (replacing the history entry, so a scroll-driven rail
 * never floods the back stack), and a deep link like `/guide#pricing` scrolls
 * to that section once on load.
 *
 * Reaches the rail through the {@link CNGX_TOC} contract token, never the
 * concrete `CngxToc` class. The activation subscription is torn down with the
 * directive via `takeUntilDestroyed` - an `OutputRef` subscription would
 * otherwise outlive route changes. Without `@angular/router` the directive
 * dev-warns once and no-ops.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/toc/toc-router-sync.directive.ts
 * @since 0.1.0
 * @relatedTo CngxToc, CNGX_TOC
 * <example-url>http://localhost:4200/#/ui/toc/router/fragment-deep-link</example-url>
 * @axis level organism
 */
@Directive({
  selector: '[cngxTocRouterSync]',
  exportAs: 'cngxTocRouterSync',
  standalone: true,
})
export class CngxTocRouterSync {
  private readonly toc = injectRouterSyncToc();
  private readonly router = inject(Router, { optional: true });
  private readonly route = inject(ActivatedRoute, { optional: true });

  constructor() {
    if (!this.router || !this.route) {
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        afterNextRender(() => warnRouterAbsent('cngxTocRouterSync', 'fragment deep-linking'));
      }
      return;
    }
    const router = this.router;

    // Write the fragment on every activation. replaceUrl keeps a scroll-driven
    // rail from pushing a history entry per section; 'merge' keeps the query
    // params a bare fragment navigate would otherwise wipe.
    outputToObservable(this.toc.activated)
      .pipe(takeUntilDestroyed())
      .subscribe((item) => {
        router
          .navigate([], { fragment: item.id, replaceUrl: true, queryParamsHandling: 'merge' })
          .catch(() => undefined);
      });

    // One-shot deep-link scroll: read the fragment present at load and bring
    // that section into view after the first render.
    const fragment = toSignal(this.route.fragment, {
      initialValue: this.route.snapshot.fragment,
    });
    afterNextRender(() => {
      const initial = fragment();
      if (initial) {
        this.toc.scrollTo(initial);
      }
    });
  }
}

function injectRouterSyncToc(): CngxTocContract {
  const toc = inject(CNGX_TOC, { host: true, optional: true });
  if (!toc) {
    throw new CngxRuntimeError(
      'CNGX3021',
      typeof ngDevMode !== 'undefined' &&
        ngDevMode &&
        '[cngxTocRouterSync] must be placed on or inside <cngx-toc>.',
    );
  }
  return toc;
}
