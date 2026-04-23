import { computed, signal, type Signal } from '@angular/core';

import {
  resolveActionSelectConfig,
  type CngxActionFocusTrapBehavior,
} from './action-select-config';
import type { CngxSelectActionCallbacks } from './panel-host';

/**
 * Surface the shared factory exposes to a select-family variant. The
 * variant plugs `dirty` + `callbacks` into its view-host contract so
 * the panel shell can read them; `shouldTrapFocus` drives the shell's
 * `actionFocusTrapEnabled` input; `shouldBlockDismiss` gates the
 * variant's own click-outside and Escape handlers.
 *
 * @category interactive
 */
export interface ActionHostBridge {
  /** Current dirty-flag. Flipped by the slot template's `setDirty` callback. */
  readonly dirty: Signal<boolean>;
  /**
   * Stable callback bundle for the slot template. Uses a structural
   * `equal` so the reference only changes when `isPending` flips —
   * prevents `ngTemplateOutlet` context churn.
   */
  readonly callbacks: Signal<CngxSelectActionCallbacks>;
  /**
   * Whether the shared panel-shell's `CngxFocusTrap` should activate.
   * Resolves `always` / `never` / `dirty` policy from
   * `CNGX_ACTION_SELECT_CONFIG` against the live dirty signal.
   */
  readonly shouldTrapFocus: Signal<boolean>;
  /**
   * Whether the variant's dismiss handlers (click-outside, Escape
   * in non-intercepted paths) should no-op. Today identical to
   * `dirty` — kept as a named accessor so Commit 5/6 can widen the
   * semantic (e.g. include "pending commit") without touching every
   * call site.
   */
  readonly shouldBlockDismiss: Signal<boolean>;
  /** Called by the variant when it executes a cancel/reset path. */
  reset(): void;
}

/**
 * Options for {@link createActionHostBridge}.
 *
 * @category interactive
 */
export interface ActionHostBridgeOptions {
  /**
   * Invoked by the slot's `close()` callback. Variants pass a bound
   * reference to their own `close()` method so the action template
   * can dismiss the panel without the consumer having to inject the
   * component instance.
   */
  readonly close: () => void;
  /**
   * Optional commit hook. The 4 existing flat variants leave it
   * `undefined` and the bridge uses a no-op — they don't own
   * quick-create semantics. `CngxActionSelect` / `CngxActionMultiSelect`
   * in Commit 5/6 wire the real `quickCreateAction` routing.
   */
  readonly commit?: (draft?: { label: string }) => void;
  /**
   * Optional `isPending` signal from the commit controller. `undefined`
   * collapses to `false`; the variants that own commit state wire
   * `this.core.isCommitting` or similar.
   */
  readonly isPending?: Signal<boolean>;
  /**
   * Optional `cancel` override for variants that need to roll back
   * in-flight state beyond flipping the dirty flag. Defaults to
   * `dirty.set(false)` only; Commit 5/6 layers rollback + search-term
   * restoration on top.
   */
  readonly cancel?: () => void;
  /**
   * Optional override for the focus-trap policy signal. Defaults to
   * `resolveActionSelectConfig().focusTrapBehavior`. Exposed so tests
   * can drive the cascade without app-level providers.
   */
  readonly focusTrapBehavior?: Signal<CngxActionFocusTrapBehavior>;
}

/**
 * Create an action-host bridge for a select-family variant.
 *
 * **What this consolidates.** Every variant that hosts an inline
 * action slot needs the same four pieces: a writable `dirty` signal,
 * a stable callbacks bundle wired into the panel shell, a
 * config-driven focus-trap policy, and a dismiss-blocking signal the
 * variant's own click-outside handler queries. Keeping the logic in
 * one place means adding the Commit-5 organisms later doesn't
 * duplicate ~40 lines of identical code across six call sites.
 *
 * **Injection context.** Must be called from a field initialiser or
 * constructor — reads `CNGX_ACTION_SELECT_CONFIG` through
 * `resolveActionSelectConfig`.
 *
 * **Reactive contract.** `callbacks` uses a structural `equal` so
 * the bundle reference only churns when `isPending` flips. `dirty`
 * is a plain writable signal (genuine state, not derivable).
 * `shouldTrapFocus` and `shouldBlockDismiss` are pure `computed`.
 * No `effect()`, no subscriptions.
 *
 * @category interactive
 */
export function createActionHostBridge(
  options: ActionHostBridgeOptions,
): ActionHostBridge {
  const dirty = signal(false);
  const resetFn = (): void => {
    dirty.set(false);
  };
  const cancelFn = options.cancel ?? resetFn;
  const commitFn =
    options.commit ??
    ((_draft?: { label: string }): void => {
      /* no-op — variants without quick-create leave this disabled */
    });
  const setDirtyFn = (value: boolean): void => {
    if (dirty() !== value) {
      dirty.set(value);
    }
  };

  const config = resolveActionSelectConfig();
  const focusTrapBehavior: Signal<CngxActionFocusTrapBehavior> =
    options.focusTrapBehavior ?? signal(config.focusTrapBehavior);
  const isPending = options.isPending;

  const callbacks = computed<CngxSelectActionCallbacks>(
    () => ({
      close: options.close,
      commit: commitFn,
      isPending: isPending?.() ?? false,
      setDirty: setDirtyFn,
      cancel: cancelFn,
    }),
    {
      // Every ref inside the bundle except `isPending` is stable for
      // the lifetime of the bridge — `close`/`commit`/`setDirty`/`cancel`
      // are captured closures. Pinning the identity to `isPending`
      // prevents spurious template-outlet context churn on every CD
      // cycle while still propagating commit-state flips correctly.
      equal: (a, b) => a.isPending === b.isPending,
    },
  );

  const shouldTrapFocus = computed<boolean>(() => {
    const behavior = focusTrapBehavior();
    if (behavior === 'always') {
      return true;
    }
    if (behavior === 'never') {
      return false;
    }
    return dirty();
  });

  return {
    dirty: dirty.asReadonly(),
    callbacks,
    shouldTrapFocus,
    shouldBlockDismiss: dirty.asReadonly(),
    reset: resetFn,
  };
}
