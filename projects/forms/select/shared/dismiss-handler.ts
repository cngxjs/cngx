import { InjectionToken, type Signal } from '@angular/core';

import type { CngxPopover } from '@cngx/common/popover';

/**
 * Config for {@link createDismissHandler}.
 */
export interface DismissHandlerOptions {
  /** Variant's `viewChild(CngxPopover)`. `.hide()` only when visible. */
  readonly popoverRef: Signal<CngxPopover | undefined>;
  /**
   * Captured once. Escape handling lives in the action-host bridge's
   * capture-phase intercept.
   */
  readonly dismissOn: 'outside' | 'escape' | 'both';
  /**
   * Action-host bridge's `shouldBlockDismiss`. Undefined for variants
   * without an action bridge.
   */
  readonly shouldBlockDismiss?: Signal<boolean>;
}

/**
 * API from {@link createDismissHandler}.
 */
export interface DismissHandler {
  /**
   * Click-outside handler. Order: shouldBlockDismiss → dismissOn check →
   * popover.hide(). Field-style closure (no `this` binding).
   */
  readonly handleClickOutside: () => void;
}

/**
 * Click-outside handler. Pure closure over `opts` — no Angular DI.
 * Override via {@link CNGX_DISMISS_HANDLER_FACTORY} for telemetry or
 * conditional-dismiss prompts.
 */
export function createDismissHandler(
  opts: DismissHandlerOptions,
): DismissHandler {
  const handleClickOutside = (): void => {
    if (opts.shouldBlockDismiss?.()) {
      return;
    }
    if (opts.dismissOn !== 'outside' && opts.dismissOn !== 'both') {
      return;
    }
    const pop = opts.popoverRef();
    if (pop?.isVisible()) {
      pop.hide();
    }
  };
  return { handleClickOutside };
}

/**
 * Factory signature for {@link CNGX_DISMISS_HANDLER_FACTORY}.
 */
export type CngxDismissHandlerFactory = (
  opts: DismissHandlerOptions,
) => DismissHandler;

/**
 * Factory token for {@link DismissHandler}. Default
 * {@link createDismissHandler}.
 */
export const CNGX_DISMISS_HANDLER_FACTORY =
  new InjectionToken<CngxDismissHandlerFactory>('CngxDismissHandlerFactory', {
    providedIn: 'root',
    factory: () => createDismissHandler,
  });
