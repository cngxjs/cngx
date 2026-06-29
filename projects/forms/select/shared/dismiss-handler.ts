import { InjectionToken, type Signal } from '@angular/core';

import type { CngxPopover } from '@cngx/common/popover';

/**
 * Config for {@link createDismissHandler}.
 *
 * @category forms/select/controllers
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
 *
 * @category forms/select/controllers
 */
export interface DismissHandler {
  /**
   * Click-outside handler. Order: shouldBlockDismiss → dismissOn check →
   * popover.hide(). Field-style closure (no `this` binding).
   */
  readonly handleClickOutside: () => void;
}

/**
 * Click-outside handler. Pure closure over `opts` - no Angular DI.
 * Override via {@link CNGX_DISMISS_HANDLER_FACTORY} for telemetry or
 * conditional-dismiss prompts.
 *
 * @category forms/select/controllers
 */
export function createDismissHandler(opts: DismissHandlerOptions): DismissHandler {
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
 *
 * @category forms/select/controllers
 */
export type CngxDismissHandlerFactory = (opts: DismissHandlerOptions) => DismissHandler;

/**
 * Factory for the `DismissHandler` that decides when an open panel closes
 * (outside click, Escape, blur, select). Default `createDismissHandler`.
 * Override to customise the dismiss triggers beyond what `withDismissOn`
 * configures.
 *
 * @category forms/select/controllers
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/dismiss-handler.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, withDismissOn
 */
export const CNGX_DISMISS_HANDLER_FACTORY = new InjectionToken<CngxDismissHandlerFactory>(
  'CngxDismissHandlerFactory',
  {
    providedIn: 'root',
    factory: () => createDismissHandler,
  },
);
