import type { CngxTabOverflowDomAdapter } from '@cngx/common/tabs';

import { MaterialPrivateSurfaces } from '../material-bridge/private-surfaces';

/**
 * Material variant of {@link CngxTabOverflowDomAdapter}.
 *
 * `resolveStripRoot` walks from host up to `<mat-tab-header>` and
 * locates `.mat-mdc-tab-label-container` via any rendered
 * `.mat-mdc-tab` descendant — Material's IO-friendly scroll
 * container.
 *
 * `resolveTabButton` indexes positionally; Material owns the DOM
 * and cngx handle ids never reach the button elements. Index
 * correlates against `presenter.tabs()` registration order.
 *
 * Wire it via the directive's
 * `CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY` provider:
 *
 * ```ts
 * providers: [
 *   { provide: CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY,
 *     useValue: createCngxMatTabOverflowDomAdapter }
 * ]
 * ```
 */
export function createCngxMatTabOverflowDomAdapter(): CngxTabOverflowDomAdapter {
  return {
    resolveStripRoot(_panelHost, host) {
      // Returning null is a retry signal — the rAF loop polls again
      // on the next frame, succeeds once MatTabHeader has committed.
      const header = host.closest<HTMLElement>(
        MaterialPrivateSurfaces.MAT_MDC_TAB_HEADER_SELECTOR,
      );
      const anyTab = header?.querySelector<HTMLElement>(
        MaterialPrivateSurfaces.MAT_MDC_TAB_SELECTOR,
      );
      return (
        anyTab?.closest<HTMLElement>(
          MaterialPrivateSurfaces.MAT_MDC_TAB_LABEL_CONTAINER_SELECTOR,
        ) ?? null
      );
    },
    resolveTabButton(_handle, root, idx) {
      return (
        root
          .querySelectorAll<HTMLElement>(
            MaterialPrivateSurfaces.MAT_MDC_TAB_SELECTOR,
          )
          .item(idx) ?? null
      );
    },
  };
}
