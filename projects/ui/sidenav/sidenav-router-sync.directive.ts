import { computed, Directive, inject, input, output } from '@angular/core';
import { injectQueryParamSync } from '@cngx/common/layout';

import { injectSidenavConfig } from './config/inject-sidenav-config';
import { CNGX_SIDENAV } from './sidenav-token';

/**
 * Deep-links a sidenav's open state into a query param. Opt-in via
 * `[cngxSidenavRouterSync]` on a `<cngx-sidenav>`: opening writes `?nav=open`,
 * an initial `?nav=open` hydrates it open, closing removes the param, and
 * browser back/forward re-hydrates it. A thin caller over
 * `injectQueryParamSync` - it reaches the rail through the {@link CNGX_SIDENAV}
 * contract token, never the concrete class.
 *
 * The `param` default cascades: per-instance `[param]` wins, then
 * `withSidenavRouterSync({ param })` on `CNGX_SIDENAV_CONFIG`, then the `'nav'`
 * literal. Without `@angular/router` the kernel dev-warns once and no-ops.
 *
 * @category ui/sidenav
 * @docsKind primary
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/sidenav/sidenav-router-sync.directive.ts
 * @since 0.1.0
 * @relatedTo CngxSidenav, CNGX_SIDENAV, injectQueryParamSync
 * <example-url>http://localhost:4200/#/ui/sidenav/router-sync/deep-linkable-overlay</example-url>
 */
@Directive({
  selector: '[cngxSidenavRouterSync]',
  exportAs: 'cngxSidenavRouterSync',
  standalone: true,
})
export class CngxSidenavRouterSync {
  private readonly sidenav = inject(CNGX_SIDENAV, { host: true });
  private readonly cfg = injectSidenavConfig();

  /**
   * Raw `[param]` input. Read the resolved {@link param} computed instead.
   * @internal
   */
  readonly paramInput = input<string | undefined>(undefined, { alias: 'param' });

  /** Resolved query-param key: `[param]` -> config `routerSync.param` -> `'nav'`. */
  readonly param = computed(() => this.paramInput() ?? this.cfg.routerSync?.param ?? 'nav');

  /** Emits when a `router.navigate` rejection is observed. Parity with the stepper sibling. */
  readonly syncError = output<unknown>();

  constructor() {
    // Pass the `param` computed itself, never `this.param()` - a constructor-time
    // read would freeze the resolved value and ignore a later-bound `[param]`.
    injectQueryParamSync(this.sidenav.opened, {
      param: this.param,
      onSyncError: (err) => this.syncError.emit(err),
    });
  }
}
