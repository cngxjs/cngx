import { ElementRef, inject, signal, type Signal } from '@angular/core';

import { isFocusLeavingHost } from '@cngx/forms/field';

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
  /**
   * Runs after `onLeave` when focus moved to a node outside the host. A
   * `null` target (window switch, click on a non-focusable area) is left to
   * the click-outside path.
   */
  readonly close?: () => void;
}

/** @internal */
export interface HostFocusWithin {
  /** True while focus is anywhere inside the host, the open panel included. */
  readonly focusedWithin: Signal<boolean>;
  /** Host `(focusin)` handler. */
  handleFocusIn(): void;
  /**
   * Host `(focusout)` handler; a move to another descendant is not a leave,
   * and neither is focus dropping to nothing (`relatedTarget === null`) from
   * an element inside the open panel - a click on a non-focusable part of the
   * panel, not a move away from the control.
   */
  handleFocusOut(event: FocusEvent): void;
  /**
   * Moves focus to the owner before a focused control inside the host goes
   * away (chip x, clear, clear-all, retry), so the removal does not drop
   * focus to `body` and read as leaving the field. No-op unless the active
   * element is inside the host and is not the owner, so a call from outside
   * the control never steals focus.
   *
   * Modal contract: the mobile sheet's `(closing)` calls this, not
   * {@link refocusOwnerBeforeClose}, so a modal sheet close always returns
   * focus to the trigger - focus must not stay on a dialog that is being
   * removed. `restoreFocus: false` governs the non-modal popover only.
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
      if (!isFocusLeavingHost(event, host) || isBlurInsideOpenPanel(event, host)) {
        return;
      }
      focused.set(false);
      opts.onLeave();
      if (event.relatedTarget instanceof Node) {
        opts.close?.();
      }
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

/**
 * Focus dropped to nothing from an element inside the host's open panel
 * (`CngxPopover` marks its host `cngx-popover--open`). The panel is a DOM
 * descendant of the host, so the element losing focus is still part of the
 * control.
 */
function isBlurInsideOpenPanel(event: FocusEvent, host: HTMLElement): boolean {
  if (event.relatedTarget !== null || !(event.target instanceof Element)) {
    return false;
  }
  const panel = event.target.closest('.cngx-popover--open');
  return panel !== null && host.contains(panel);
}
