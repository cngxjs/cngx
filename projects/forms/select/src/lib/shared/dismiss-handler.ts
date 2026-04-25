import { InjectionToken, type Signal } from '@angular/core';

import type { CngxPopover } from '@cngx/common/popover';

/**
 * Configuration for {@link createDismissHandler}. Every reactive
 * surface is signal-valued so the handler stays reactive to runtime
 * config flips; the `popoverRef` is read lazily per call because the
 * popover viewChild resolves after construction.
 *
 * @category interactive
 */
export interface DismissHandlerOptions {
  /**
   * Popover handle the handler dismisses when the resolved strategy
   * allows. Accepts the variant's `viewChild(CngxPopover)` query
   * signal; the handler calls `.hide()` only when `.isVisible()` is
   * true, so spurious clicks on a closed panel are no-ops.
   */
  readonly popoverRef: Signal<CngxPopover | undefined>;
  /**
   * App-wide dismiss strategy resolved from `CngxSelectConfig.dismissOn`.
   * `'outside'` and `'both'` enable click-outside dismissal; `'escape'`
   * disables it (Escape handling lives elsewhere, typically in the
   * action-host bridge's capture-phase intercept). Captured once at
   * factory-call time — same lifecycle contract as the other
   * immutable-per-injector config keys (`panelClass`, `restoreFocus`).
   * If a future variant needs reactive toggling, swap to
   * `Signal<...>` here and at the call-site.
   */
  readonly dismissOn: 'outside' | 'escape' | 'both';
  /**
   * Guard bound to the action-host bridge's `shouldBlockDismiss`
   * signal — when the inline action workflow is dirty, click-outside
   * must not dismiss the panel. Optional: variants without an action
   * bridge (today: CngxTreeSelect) leave this undefined and the
   * handler short-circuits to the dismiss-strategy check only.
   */
  readonly shouldBlockDismiss?: Signal<boolean>;
}

/**
 * API returned from {@link createDismissHandler}.
 *
 * @category interactive
 */
export interface DismissHandler {
  /**
   * Click-outside handler. Bound to the variant's template via
   * `(clickOutside)="handleClickOutside()"`. Runs three checks in
   * order:
   *
   *   1. If `shouldBlockDismiss()` is `true` — bail (action dirty).
   *   2. If `dismissOn` is `'escape'` — bail (click-outside disabled).
   *   3. If the popover is visible — hide it.
   *
   * Typed as a field-style function (not a method) so consumers can
   * destructure or unbind the reference without losing `this` — the
   * factory returns a closure over `opts`, not an object-bound method.
   */
  readonly handleClickOutside: () => void;
}

/**
 * Factory for the click-outside dismissal handler shared by every
 * select-family variant. The pattern is identical across seven
 * components: read `shouldBlockDismiss`, check `dismissOn`, hide the
 * popover if visible. Extracting it behind a DI token lets enterprise
 * consumers wire click-outside telemetry, conditional-dismiss guards
 * (e.g. prompt on unsaved changes), or delayed-dismiss UX from a
 * single provider override.
 *
 * **Must run in an injection context** when consumed via the DI
 * token. The default factory itself has no Angular-context
 * dependencies — it's a pure closure over the options.
 *
 * @category interactive
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
 * Factory-signature type — mirrors {@link createDismissHandler} so
 * DI overrides match the exact shape of the default.
 *
 * @category interactive
 */
export type CngxDismissHandlerFactory = (
  opts: DismissHandlerOptions,
) => DismissHandler;

/**
 * DI token resolving the factory used to construct the click-outside
 * handler for every select-family variant. Defaults to
 * {@link createDismissHandler}; override app-wide via
 * `providers: [{ provide: CNGX_DISMISS_HANDLER_FACTORY, useValue: customFactory }]`
 * or per-component via `viewProviders` to layer telemetry,
 * conditional-dismiss prompts, delayed-dismiss UX, or any other
 * enterprise policy without forking the seven variants.
 *
 * Symmetrical to the other select-family factory tokens
 * (`CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY`, `CNGX_SEARCH_EFFECTS_FACTORY`,
 * `CNGX_SCALAR_COMMIT_HANDLER_FACTORY`, …).
 *
 * @category interactive
 */
export const CNGX_DISMISS_HANDLER_FACTORY =
  new InjectionToken<CngxDismissHandlerFactory>('CngxDismissHandlerFactory', {
    providedIn: 'root',
    factory: () => createDismissHandler,
  });
