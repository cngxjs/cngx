import {
  InjectionToken,
  effect,
  untracked,
  type ElementRef,
  type OutputEmitterRef,
  type Signal,
} from '@angular/core';

/**
 * Configuration for {@link createPanelLifecycleEmitter}. Each select-
 * family variant passes its own trigger-focus target and its own
 * three output refs; the factory wires the shared effect that emits
 * `openedChange` + `opened` + `closed` in response to `panelOpen`
 * flips and restores focus to the trigger after close.
 *
 * @category interactive
 */
export interface PanelLifecycleEmitterOptions {
  /** Current panel open/closed state. */
  readonly panelOpen: Signal<boolean>;
  /**
   * The trigger element the factory re-focuses after the panel
   * closes. Button-trigger variants pass their `viewChild` of the
   * `<button>`; input-trigger variants pass their `<input>` ref.
   * Read lazily — the factory never stores the ref, it dereferences
   * on every close transition so late-mount queries work correctly.
   */
  readonly restoreFocusTarget: Signal<ElementRef<HTMLElement> | undefined>;
  /**
   * Whether to restore focus on close. Captured once — every call
   * site today binds this to `CNGX_SELECT_CONFIG.restoreFocus` which
   * is resolved per-injector at component construction and never
   * mutates. If a future variant needs reactive toggling, swap to a
   * `Signal<boolean>` here.
   */
  readonly restoreFocus: boolean;
  /** `openedChange` output emitter (emits boolean on every transition). */
  readonly openedChange: OutputEmitterRef<boolean>;
  /** `opened` output emitter (void — fires only when the panel opens). */
  readonly opened: OutputEmitterRef<void>;
  /** `closed` output emitter (void — fires only when the panel closes). */
  readonly closed: OutputEmitterRef<void>;
}

/**
 * Wire the shared panel-lifecycle effect for a select-family variant.
 *
 * **Why a factory.** Every variant in the family — single, multi,
 * combobox, typeahead, tree, reorderable-multi, action-select,
 * action-multi-select — used to carry a verbatim `effect(() => {
 * const open = this.panelOpen(); untracked(() => { ... }); })` block
 * plus a `queueMicrotask(() => target?.focus())` restore on close.
 * The only per-variant divergence was the focus target (button vs.
 * input) and the three output emitter refs.
 *
 * Extracting the pattern behind a factory collapses each call site
 * to a single line AND creates a DI override point: enterprise
 * consumers wanting panel open/close telemetry (Mixpanel events,
 * latency histograms, popover-conflict detection) can now provide a
 * custom factory once and every variant picks it up.
 *
 * **Must run in an injection context.** Installs one `effect()` via
 * Angular's default DestroyRef scope. Every external-service call
 * inside the effect is wrapped in `untracked()` so the factory never
 * registers spurious reactive dependencies through the output emits
 * or the DOM focus call.
 *
 * @category interactive
 */
export function createPanelLifecycleEmitter(
  opts: PanelLifecycleEmitterOptions,
): void {
  effect(() => {
    const open = opts.panelOpen();
    untracked(() => {
      opts.openedChange.emit(open);
      if (open) {
        opts.opened.emit();
        return;
      }
      opts.closed.emit();
      if (!opts.restoreFocus) {
        return;
      }
      // Microtask so the focus write happens after the current CD
      // cycle finishes — otherwise the popover-close DOM mutation can
      // land on an element that's about to detach, throwing the focus
      // into the document body.
      queueMicrotask(() => opts.restoreFocusTarget()?.nativeElement.focus());
    });
  });
}

/**
 * Factory-signature type — mirrors {@link createPanelLifecycleEmitter}
 * so DI overrides match the exact shape of the default.
 *
 * @category interactive
 */
export type CngxPanelLifecycleEmitterFactory = (
  opts: PanelLifecycleEmitterOptions,
) => void;

/**
 * DI token resolving the factory used to wire the panel-lifecycle
 * effect. Defaults to {@link createPanelLifecycleEmitter}; override
 * app-wide via `providers: [{ provide: CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY, useValue: customFactory }]`
 * or per-component via `viewProviders` to layer telemetry, analytics
 * instrumentation, or a custom focus-restore strategy — without
 * forking any of the seven select-family variants that share this
 * factory.
 *
 * Symmetrical to the rest of the select-family factory tokens
 * (`CNGX_SELECTION_CONTROLLER_FACTORY`,
 * `CNGX_SELECT_COMMIT_CONTROLLER_FACTORY`,
 * `CNGX_SCALAR_COMMIT_HANDLER_FACTORY`, etc.).
 *
 * @category interactive
 */
export const CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY =
  new InjectionToken<CngxPanelLifecycleEmitterFactory>(
    'CngxPanelLifecycleEmitterFactory',
    {
      providedIn: 'root',
      factory: () => createPanelLifecycleEmitter,
    },
  );
