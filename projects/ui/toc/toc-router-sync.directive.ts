import { afterNextRender, Directive, inject } from '@angular/core';
import { outputToObservable, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { CNGX_TOC } from './toc-token';

/**
 * Dev-warning emitted when `@angular/router` is absent. A deliberate small
 * local copy of the `@cngx/common/layout` kernel's warning rather than a
 * shared import - sharing would force the helper onto a `public-api.ts`, and
 * `warn*` matches no approved public-API prefix (same call the tabs and
 * sidenav sync directives make).
 *
 * @internal
 */
function warnRouterAbsent(directive: string, enables: string): void {
  console.warn(
    `${directive}: no Router available - directive is a no-op. ` +
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
 * @category ui/toc
 * @docsKind primary
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/toc/toc-router-sync.directive.ts
 * @since 0.1.0
 * @relatedTo CngxToc, CNGX_TOC
 * <example-url>http://localhost:4200/#/ui/toc/router/fragment-deep-link</example-url>
 */
@Directive({
  selector: '[cngxTocRouterSync]',
  exportAs: 'cngxTocRouterSync',
  standalone: true,
})
export class CngxTocRouterSync {
  private readonly toc = inject(CNGX_TOC, { host: true });
  private readonly router = inject(Router, { optional: true });
  private readonly route = inject(ActivatedRoute, { optional: true });

  constructor() {
    if (!this.router || !this.route) {
      afterNextRender(() => warnRouterAbsent('CngxTocRouterSync', 'fragment deep-linking'));
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
