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
 * @category interactive
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
}

/**
 * One `effect()` that emits `openedChange`/`opened`/`closed` on
 * `panelOpen` flips and restores focus to the trigger after close.
 * Output emits + focus call wrapped in `untracked`. Injection context
 * required.
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
      // Microtask defers focus past the popover-close DOM mutation;
      // otherwise focus lands on a detaching element and falls to body.
      queueMicrotask(() => opts.restoreFocusTarget()?.nativeElement.focus());
    });
  });
}

/**
 * Factory signature for {@link CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY}.
 *
 * @category interactive
 */
export type CngxPanelLifecycleEmitterFactory = (
  opts: PanelLifecycleEmitterOptions,
) => void;

/**
 * Factory token. Default {@link createPanelLifecycleEmitter}. Override
 * for telemetry, analytics, or custom focus-restore strategy.
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
