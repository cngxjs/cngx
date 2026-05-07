import { InjectionToken } from '@angular/core';

import type { CngxTabHandle } from '../tab-group-host.token';
import type { CngxTabPanelHost } from '../tab-panel-host.token';

/**
 * Resolves the DOM elements `<cngx-tab-overflow>` observes for
 * visibility tracking. The cngx-native variant queries
 * `.cngx-tabs__strip-wrapper` for the IntersectionObserver root and
 * `[id="${handle.id}-header"]` for each tab button; the Material
 * variant walks up to `.mat-mdc-tab-label-container` and indexes
 * positionally into `.mat-mdc-tab` rendered buttons. The molecule
 * itself is variant-agnostic — it consumes whichever adapter the
 * directive provides through
 * {@link CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY}.
 *
 * @category interactive
 */
export interface CngxTabOverflowDomAdapter {
  /**
   * Resolves the IntersectionObserver root — the scroll viewport the
   * molecule observes per tab handle. Returning `null` short-circuits
   * the attach attempt; the molecule's rAF retry loop polls again on
   * the next frame.
   *
   * @param panelHost The injected `CNGX_TAB_PANEL_HOST` contract.
   * @param host The molecule's host element (`<cngx-tab-overflow>`).
   */
  resolveStripRoot(
    panelHost: CngxTabPanelHost,
    host: HTMLElement,
  ): HTMLElement | null;

  /**
   * Resolves the rendered button element for `handle` inside `root`.
   * The cngx-native default keys by `handle.id` because organism-
   * authored buttons carry the matching DOM id; Material adapters
   * key by `idx` because Material owns the rendered DOM and cngx
   * handle ids never appear on it.
   *
   * @param handle Tab handle from `panelHost.tabs()`.
   * @param root The element returned by {@link resolveStripRoot}.
   * @param idx Position of `handle` in `panelHost.tabs()` (0-based).
   */
  resolveTabButton(
    handle: CngxTabHandle,
    root: HTMLElement,
    idx: number,
  ): HTMLElement | null;
}

/**
 * Factory signature for {@link CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY}.
 * Override-target shape so consumer providers match the contract
 * the molecule injects.
 *
 * @category interactive
 */
export type CngxTabOverflowDomAdapterFactory = () => CngxTabOverflowDomAdapter;

/**
 * Default adapter factory. Mirrors the cngx-native
 * `<cngx-tab-group>` selector contract byte-for-byte —
 * `host.closest('.cngx-tabs__strip-wrapper')` walks up to the strip
 * wrapper and `querySelector('.cngx-tabs__strip')` resolves the
 * IntersectionObserver root; `[id="${handle.id}-header"]` resolves
 * each per-tab button by the organism-applied DOM id.
 *
 * @category interactive
 */
export function createCngxTabOverflowDefaultDomAdapter(): CngxTabOverflowDomAdapter {
  return {
    resolveStripRoot(_panelHost, host) {
      const wrapper = host.closest<HTMLElement>('.cngx-tabs__strip-wrapper');
      return wrapper?.querySelector<HTMLElement>('.cngx-tabs__strip') ?? null;
    },
    resolveTabButton(handle, root, _idx) {
      return root.querySelector<HTMLElement>(`[id="${handle.id}-header"]`);
    },
  };
}

/**
 * DI factory token for the overflow molecule's DOM-resolution
 * strategy. Override at the directive's `providers`
 * (or component-scope `viewProviders`) to swap in a Material,
 * custom-skin, or test-double adapter without forking the molecule.
 *
 * Defaults to {@link createCngxTabOverflowDefaultDomAdapter}.
 *
 * @category interactive
 */
export const CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY =
  new InjectionToken<CngxTabOverflowDomAdapterFactory>(
    'CngxTabOverflowDomAdapterFactory',
    {
      providedIn: 'root',
      factory: () => createCngxTabOverflowDefaultDomAdapter,
    },
  );
