import {
  computed,
  DestroyRef,
  ElementRef,
  InjectionToken,
  inject,
  signal,
  type Signal,
} from '@angular/core';

import {
  resolveActionSelectConfig,
  type CngxActionFocusTrapBehavior,
} from './action-select-config';
import type { CngxSelectActionCallbacks } from './panel-host';

/**
 * Bridge surface plugged into the variant's view-host contract:
 * `dirty` + `callbacks` feed the panel shell, `shouldTrapFocus` drives
 * the shell's `actionFocusTrapEnabled`, `shouldBlockDismiss` gates the
 * variant's click-outside and Escape handlers.
 */
export interface ActionHostBridge {
  /** Dirty flag flipped by the slot's `setDirty` callback. */
  readonly dirty: Signal<boolean>;
  /**
   * Stable callback bundle for the slot template — structural `equal`
   * pinned to `isPending` only, prevents `ngTemplateOutlet` context churn.
   */
  readonly callbacks: Signal<CngxSelectActionCallbacks>;
  /** Resolves the `always|never|dirty` policy against the live dirty signal. */
  readonly shouldTrapFocus: Signal<boolean>;
  /**
   * Gates click-outside and Escape no-op behaviour. Aliased to `dirty` today,
   * named separately so the semantic can widen later without touching call
   * sites.
   */
  readonly shouldBlockDismiss: Signal<boolean>;
  /** Called by the variant on cancel/reset. */
  reset(): void;
}

/**
 * Options for {@link createActionHostBridge}.
 */
export interface ActionHostBridgeOptions {
  /** Bound `close()` from the variant — dismisses the panel. */
  readonly close: () => void;
  /** Quick-create commit hook. Flat variants leave undefined; bridge no-ops. */
  readonly commit?: (draft?: { label: string }) => void;
  /** Commit-controller `isPending`. Undefined collapses to `false`. */
  readonly isPending?: Signal<boolean>;
  /** Cancel hook. Default flips dirty to `false`. */
  readonly cancel?: () => void;
  /** Override for the focus-trap policy signal. Test seam. */
  readonly focusTrapBehavior?: Signal<CngxActionFocusTrapBehavior>;
  /** Retry hook for the slot's `retry` context field. Default: no-op. */
  readonly retry?: () => void;
}

/**
 * Action-host bridge for a select-family variant: dirty signal + stable
 * callbacks bundle + focus-trap policy + dismiss-block signal. `dirty` is
 * the only writable slot; everything else is `computed`. Installs a
 * capture-phase Escape listener on the host element via `DestroyRef`.
 * Injection context required.
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
      // No-op for variants without quick-create.
    });
  const retryFn =
    options.retry ??
    ((): void => {
      // No-op for variants without quick-create.
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
      retry: retryFn,
    }),
    {
      // Every field except isPending is a captured closure stable for the
      // bridge lifetime; pin equal on isPending so the ref only churns
      // when commit state flips.
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

  // Capture-phase Escape on the variant root — trigger input is a sibling
  // of the popover, so a panel-level listener never sees it.
  const hostEl = inject(ElementRef<HTMLElement>, { optional: true });
  const destroyRef = inject(DestroyRef, { optional: true });
  if (hostEl && destroyRef) {
    const el = hostEl.nativeElement as HTMLElement;
    const handler = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') {
        return;
      }
      if (!dirty()) {
        return;
      }
      cancelFn();
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    el.addEventListener('keydown', handler, { capture: true });
    destroyRef.onDestroy(() => {
      el.removeEventListener('keydown', handler, { capture: true });
    });
  }

  return {
    dirty: dirty.asReadonly(),
    callbacks,
    shouldTrapFocus,
    shouldBlockDismiss: dirty.asReadonly(),
    reset: resetFn,
  };
}

/**
 * Factory signature for {@link CNGX_ACTION_HOST_BRIDGE_FACTORY}.
 */
export type CngxActionHostBridgeFactory = (
  options: ActionHostBridgeOptions,
) => ActionHostBridge;

/**
 * Factory token for {@link ActionHostBridge}. Default
 * {@link createActionHostBridge}. Override via `providers` /
 * `viewProviders` for telemetry, audit logging, or offline persistence.
 *
 * @example
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [
 *     {
 *       provide: CNGX_ACTION_HOST_BRIDGE_FACTORY,
 *       useValue: (opts) => createActionHostBridge(opts),
 *     },
 *   ],
 * });
 * ```
 */
export const CNGX_ACTION_HOST_BRIDGE_FACTORY =
  new InjectionToken<CngxActionHostBridgeFactory>(
    'CngxActionHostBridgeFactory',
    {
      providedIn: 'root',
      factory: () => createActionHostBridge,
    },
  );
