import {
  InjectionToken,
  effect,
  untracked,
  type ElementRef,
  type OutputEmitterRef,
  type Signal,
} from '@angular/core';
import { createTransitionTracker } from '@cngx/core/utils';

/**
 * Config for {@link createPanelLifecycleEmitter}.
 *
 * @category forms/select/panel
 */
export interface PanelLifecycleEmitterOptions {
  /**
   * Only flips of this signal emit. The value it holds at mount is the
   * initial state, not a transition, and is never emitted.
   */
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
 * `panelOpen` flips and restores focus to the trigger after an
 * open -> closed flip. The mount value is not a flip: a panel mounted
 * closed emits nothing and never moves focus, a panel mounted open
 * emits no `opened`. Output emits + focus call wrapped in `untracked`.
 * Injection context required.
 *
 * @category forms/select/panel
 */
export function createPanelLifecycleEmitter(
  opts: PanelLifecycleEmitterOptions,
): void {
  const flip = createTransitionTracker(() => opts.panelOpen());
  effect(() => {
    const open = flip.current();
    if (open === flip.previous()) {
      return;
    }
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
 * Custom factories keep the contract: emit and restore focus on real
 * `panelOpen` flips only, never for the value `panelOpen` holds at mount -
 * a mount-time restore steals page focus from wherever it was.
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
