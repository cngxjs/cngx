import type { CngxTabOverflowDomAdapter } from '@cngx/common/tabs';

import { MaterialPrivateSurfaces } from '../material-bridge/private-surfaces';

/**
 * Material variant of {@link CngxTabOverflowDomAdapter}.
 *
 * `resolveStripRoot` walks from the molecule's host up to the
 * `<mat-tab-header>` mount anchor and locates the
 * `.mat-mdc-tab-label-container` scroll viewport via any rendered
 * `.mat-mdc-tab` descendant — Material's IO-friendly scroll
 * container, structurally guaranteed across Material 19/20/21
 * (tracked under `tabs-accepted-debt §5`).
 *
 * `resolveTabButton` indexes positionally into `.mat-mdc-tab` rather
 * than keying by `handle.id`. Material owns the rendered DOM; cngx
 * handle ids never appear on the buttons. The index correlates
 * against `presenter.tabs()` registration order — same accepted-debt
 * surface as the rejection + aggregator decoration paths in
 * `mat-tabs.directive.ts`.
 *
 * Override the directive's
 * `CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY` provider with this factory
 * to wire the cngx overflow molecule onto a Material strip:
 *
 * ```ts
 * providers: [
 *   { provide: CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY,
 *     useValue: createCngxMatTabOverflowDomAdapter }
 * ]
 * ```
 *
 * @category interactive
 */
export function createCngxMatTabOverflowDomAdapter(): CngxTabOverflowDomAdapter {
  return {
    resolveStripRoot(_panelHost, host) {
      // Walk up to the Material tab header — the mount anchor
      // [cngxMatTabs] uses to physically place the molecule. From
      // there, locate any rendered .mat-mdc-tab button and walk up
      // to its .mat-mdc-tab-label-container ancestor (the IO root).
      // Returning null when the header has not yet rendered any tab
      // button keeps the rAF retry loop polling — it will succeed on
      // a subsequent frame once Material's MatTabHeader template has
      // committed.
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
