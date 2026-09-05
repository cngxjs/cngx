import {
  InjectionToken,
  effect,
  untracked,
  type ElementRef,
  type OutputEmitterRef,
  type Signal,
} from '@angular/core';

/**
 * Config for {@link createPanelLifecycleEmitter}.
 *
 * @category forms/select/panel
 */
export interface PanelLifecycleEmitterOptions {
  readonly panelOpen: Signal<boolean>;
  /** Re-focused after close. Dereferenced lazily on each transition. */
  readonly restoreFocusTarget: Signal<ElementRef<HTMLElement> | undefined>;
  /** Captured once. */
  readonly restoreFocus: boolean;
  readonly openedChange: OutputEmitterRef<boolean>;
  readonly opened: OutputEmitterRef<void>;
  readonly closed: OutputEmitterRef<void>;
  /**
   * Called synchronously around the post-close focus restore with
   * `true` before and `false` after the programmatic `.focus()`. Hosts
   * honoring `openOn: 'focus'` use the window to suppress their
   * focus-opens-panel strategy - otherwise the restore would reopen
   * the panel that just closed. Optional; custom factories may ignore
   * it when they implement their own restore strategy.
   */
  readonly restoringFocus?: (active: boolean) => void;
}

/**
 * One `effect()` that emits `openedChange`/`opened`/`closed` on
 * `panelOpen` flips and restores focus to the trigger after close.
 * Output emits + focus call wrapped in `untracked`. Injection context
 * required.
 *
 * @category forms/select/panel
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
      // Microtask defers focus past the popover-close DOM mutation;
      // otherwise focus lands on a detaching element and falls to body.
      queueMicrotask(() => {
        const target = opts.restoreFocusTarget()?.nativeElement;
        if (!target) {
          return;
        }
        // Focus handlers run synchronously inside .focus(), so the
        // suppression window closes right after the call returns.
        opts.restoringFocus?.(true);
        try {
          target.focus();
        } finally {
          opts.restoringFocus?.(false);
        }
      });
    });
  });
}

/**
 * Factory signature for {@link CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY}.
 *
 * @category forms/select/panel
 */
export type CngxPanelLifecycleEmitterFactory = (
  opts: PanelLifecycleEmitterOptions,
) => void;

/**
 * Factory for the panel lifecycle emitter - runs open / close side effects and
 * restores focus to the trigger on close. Default `createPanelLifecycleEmitter`.
 * Override for telemetry, analytics, or a custom focus-restore strategy.
 *
 * @category forms/select/panel
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/panel-lifecycle-emitter.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, withRestoreFocus
 */
export const CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY =
  new InjectionToken<CngxPanelLifecycleEmitterFactory>(
    'CngxPanelLifecycleEmitterFactory',
    {
      providedIn: 'root',
      factory: () => createPanelLifecycleEmitter,
    },
  );
