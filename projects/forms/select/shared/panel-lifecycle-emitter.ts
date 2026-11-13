import {
  ElementRef,
  InjectionToken,
  effect,
  inject,
  untracked,
  type OutputEmitterRef,
  type Signal,
} from '@angular/core';
import { createTransitionTracker } from '@cngx/core/utils';

/**
 * Inputs a composite hands to its panel lifecycle emitter.
 *
 * All nine composites pass their panel-open signal, their
 * `openedChange` / `opened` / `closed` outputs and the trigger as
 * `restoreFocusTarget`. `restoreFocus` comes from `withRestoreFocus` and is
 * read once at construction. A consumer meets this shape only when it replaces
 * the emitter through {@link CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY}.
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
 * open -> closed flip. Injection context required (the host is the
 * injecting component).
 *
 * The mount value is not a flip: a panel mounted closed emits nothing and
 * never moves focus, a panel mounted open emits no `opened`. Output emits
 * and the focus call run in `untracked`.
 *
 * The restore is skipped when focus already sits on an element outside
 * the host (Tab out of an open panel, a click into another input): the
 * user moved it there, and pulling it back would cost them a second
 * Tab. Focus on `body` or inside the host is restored as before.
 */
export function createPanelLifecycleEmitter(opts: PanelLifecycleEmitterOptions): void {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
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
        if (!target || focusMovedOutside(host)) {
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

/** Focus sits on an element outside `host` that is not `body`. */
function focusMovedOutside(host: HTMLElement): boolean {
  const doc = host.ownerDocument;
  const active = doc.activeElement;
  return active !== null && active !== doc.body && !host.contains(active);
}

/**
 * Function shape a replacement panel lifecycle emitter must have.
 *
 * Each composite calls it once during construction, in an injection context,
 * and reads nothing back: the emitter works through the outputs and the focus
 * target it receives. Provide it through
 * {@link CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY}.
 */
export type CngxPanelLifecycleEmitterFactory = (opts: PanelLifecycleEmitterOptions) => void;

/**
 * Factory for the panel lifecycle emitter - runs open / close side effects and
 * restores focus to the trigger on close. Default `createPanelLifecycleEmitter`.
 * Override for telemetry, analytics, or a custom focus-restore strategy.
 * Custom factories keep the contract: emit and restore focus on real
 * `panelOpen` flips only, never for the value `panelOpen` holds at mount -
 * a mount-time restore steals page focus from wherever it was.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/panel-lifecycle-emitter.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, withRestoreFocus
 */
export const CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY =
  new InjectionToken<CngxPanelLifecycleEmitterFactory>('CngxPanelLifecycleEmitterFactory', {
    providedIn: 'root',
    factory: () => createPanelLifecycleEmitter,
  });
