import { ElementRef, inject, signal, type Signal } from '@angular/core';

/** @internal */
export interface HostFocusWithinOptions {
  /** Runs once focus leaves the host; the variants mark the field touched here. */
  readonly onLeave: () => void;
  /** The focus owner: the trigger, or the input of an input-owned variant. */
  readonly owner: () => HTMLElement | undefined;
  /** `CngxSelectConfig.restoreFocus`; `false` keeps focus where it is on close. */
  readonly restoreFocus: boolean;
  /**
   * Brackets the refocus so an `openOn: 'focus'` trigger does not reopen the
   * panel - the same window the lifecycle emitter's close restore opens.
   */
  readonly suppressOpenOnFocus?: (active: boolean) => void;
}

/** @internal */
export interface HostFocusWithin {
  /** True while focus is anywhere inside the host, the open panel included. */
  readonly focusedWithin: Signal<boolean>;
  /** Host `(focusin)` handler. */
  handleFocusIn(): void;
  /** Host `(focusout)` handler; a move to another descendant is not a leave. */
  handleFocusOut(event: FocusEvent): void;
  /**
   * Moves focus to the owner before a focused control inside the host goes
   * away (chip x, clear, clear-all, retry), so the removal does not drop
   * focus to `body` and read as leaving the field. No-op unless the active
   * element is inside the host and is not the owner, so a call from outside
   * the control never steals focus.
   */
  refocusOwnerBeforeRemoval(): void;
  /**
   * The same before the panel hides: `CngxPopover` blurs focus inside the
   * panel before hiding it. Skipped under `restoreFocus: false`.
   */
  refocusOwnerBeforeClose(): void;
  /** `remove` with {@link refocusOwnerBeforeRemoval} first; stable per `remove`. */
  withRefocus(remove: () => void): () => void;
}

/**
 * Field-facing focus of a select-family variant. Focus moving from the
 * trigger into the variant's own panel (tree container, search input, retry
 * or action button) stays inside the host - every variant renders its
 * `cngxPopover` inside the host, so the panel is a DOM descendant even in
 * the top layer. Only a move outside the host clears `focusedWithin` and
 * runs `onLeave`.
 *
 * The trigger focus slot (`CNGX_TRIGGER_FOCUS_FACTORY`) is separate and
 * keeps the trigger meaning for the display binding and the slot contexts.
 *
 * Injection context required.
 *
 * @internal
 */
export function createHostFocusWithin(opts: HostFocusWithinOptions): HostFocusWithin {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const focused = signal(false);
  const wrapped = new WeakMap<() => void, () => void>();

  const refocusOwnerBeforeRemoval = (): void => {
    const owner = opts.owner();
    const active = host.ownerDocument.activeElement;
    if (!owner || !active || active === owner || !host.contains(active)) {
      return;
    }
    opts.suppressOpenOnFocus?.(true);
    try {
      owner.focus();
    } finally {
      opts.suppressOpenOnFocus?.(false);
    }
  };

  return {
    focusedWithin: focused.asReadonly(),
    handleFocusIn: () => {
      focused.set(true);
    },
    handleFocusOut: (event) => {
      const next = event.relatedTarget;
      if (next instanceof Node && host.contains(next)) {
        return;
      }
      focused.set(false);
      opts.onLeave();
    },
    refocusOwnerBeforeRemoval,
    refocusOwnerBeforeClose: () => {
      if (opts.restoreFocus) {
        refocusOwnerBeforeRemoval();
      }
    },
    withRefocus: (remove) => {
      let fn = wrapped.get(remove);
      if (!fn) {
        fn = () => {
          refocusOwnerBeforeRemoval();
          remove();
        };
        wrapped.set(remove, fn);
      }
      return fn;
    },
  };
}
