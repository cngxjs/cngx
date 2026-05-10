import { InjectionToken } from '@angular/core';

import type { CngxTabHandle } from '../tab-group-host.token';
import type { CngxTabPanelHost } from '../tab-panel-host.token';

/**
 * Resolves the DOM elements `<cngx-tab-overflow>` observes. cngx-native
 * keys by `[id="${handle.id}-header"]`; the Material twin keys by
 * positional index into `.mat-mdc-tab` (handle ids never appear on
 * Material's rendered DOM). The molecule is variant-agnostic and
 * consumes whichever adapter
 * {@link CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY} provides.
 *
 * @category interactive
 */
export interface CngxTabOverflowDomAdapter {
  /**
   * Resolve the IntersectionObserver root — the scroll viewport the
   * molecule observes. Returning `null` short-circuits the attach;
   * the molecule's rAF retry loop polls again next frame.
   */
  resolveStripRoot(
    panelHost: CngxTabPanelHost,
    host: HTMLElement,
  ): HTMLElement | null;

  /**
   * Resolve the rendered button for `handle` inside `root`. cngx-native
   * keys by `handle.id`; Material adapters key by `idx`.
   */
  resolveTabButton(
    handle: CngxTabHandle,
    root: HTMLElement,
    idx: number,
  ): HTMLElement | null;
}

/**
 * Factory signature for {@link CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY}.
 *
 * @category interactive
 */
export type CngxTabOverflowDomAdapterFactory = () => CngxTabOverflowDomAdapter;

/**
 * Default adapter for the cngx-native `<cngx-tab-group>` strip:
 * walks `host.closest('.cngx-tabs__strip-wrapper')` for the IO root,
 * then `[id="${handle.id}-header"]` for each button.
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
 * DI token for the overflow molecule's DOM-resolution strategy.
 * Override at directive `providers` or component `viewProviders` to
 * swap in a Material, custom-skin, or test-double adapter without
 * forking the molecule. Defaults to
 * {@link createCngxTabOverflowDefaultDomAdapter}.
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
