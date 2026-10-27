import { InjectionToken, type Signal } from '@angular/core';

import type { CngxPopover, CngxPopoverSheetCloseReason } from '@cngx/common/popover';

/**
 * Config for {@link createDismissHandler}.
 */
export interface DismissHandlerOptions {
  /** Variant's `viewChild(CngxPopover)`. `.hide()` only when visible. */
  readonly popoverRef: Signal<CngxPopover | undefined>;
  /**
   * Captured once. `'outside'` closes on an outside click only: Escape stays
   * off on every path (popover, trigger, in-sheet input), enforced by the
   * select sheet wiring's `escapeEnabled`. `'escape'` closes on Escape only.
   * The action-host bridge's capture-phase intercept still owns a dirty
   * action slot's Escape.
   */
  readonly dismissOn: 'outside' | 'escape' | 'both';
  /**
   * Action-host bridge's `shouldBlockDismiss`. Undefined for variants
   * without an action bridge.
   */
  readonly shouldBlockDismiss?: Signal<boolean>;
  /**
   * A pessimistic commit is pending. Blocks every sheet close request
   * (select-family close-on-success rule). Undefined for variants without
   * a `commitMode`.
   */
  readonly closeBlocked?: Signal<boolean>;
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
  /**
   * Close request from the mobile sheet (header swipe, outside tap, Android
   * back, X / Done). Order: closeBlocked → shouldBlockDismiss → `'backdrop'`
   * honours `dismissOn` like an outside click → popover.hide(). Optional so
   * existing {@link CNGX_DISMISS_HANDLER_FACTORY} overrides keep compiling;
   * without it the variant falls back to `handleClickOutside` for
   * `'backdrop'` and a plain hide for the rest.
   */
  readonly handleSheetClose?: (reason: CngxPopoverSheetCloseReason) => void;
}

/**
 * Click-outside handler. Pure closure over `opts` - no Angular DI.
 * Override via {@link CNGX_DISMISS_HANDLER_FACTORY} for telemetry or
 * conditional-dismiss prompts.
 */
export function createDismissHandler(opts: DismissHandlerOptions): DismissHandler {
  const outsideAllowed = opts.dismissOn === 'outside' || opts.dismissOn === 'both';
  const hideIfVisible = (): void => {
    const pop = opts.popoverRef();
    if (pop?.isVisible()) {
      pop.hide();
    }
  };
  const handleClickOutside = (): void => {
    if (opts.shouldBlockDismiss?.()) {
      return;
    }
    if (!outsideAllowed) {
      return;
    }
    hideIfVisible();
  };
  const handleSheetClose = (reason: CngxPopoverSheetCloseReason): void => {
    if (opts.closeBlocked?.()) {
      return;
    }
    if (opts.shouldBlockDismiss?.()) {
      return;
    }
    if (reason === 'backdrop' && !outsideAllowed) {
      return;
    }
    hideIfVisible();
  };
  return { handleClickOutside, handleSheetClose };
}

/**
 * Factory signature for {@link CNGX_DISMISS_HANDLER_FACTORY}.
 */
export type CngxDismissHandlerFactory = (opts: DismissHandlerOptions) => DismissHandler;

/**
 * Factory for the `DismissHandler` that decides when an open panel closes
 * (outside click, Escape, blur, select). Default `createDismissHandler`.
 * Override to customise the dismiss triggers beyond what `withDismissOn`
 * configures.
 *
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
