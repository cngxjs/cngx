import { ElementRef, inject, signal, type Signal } from '@angular/core';

/** @internal */
export interface HostFocusWithinOptions {
  /** Runs once focus leaves the host; the variants mark the field touched here. */
  readonly onLeave: () => void;
}

/** @internal */
export interface HostFocusWithin {
  /** True while focus is anywhere inside the host, the open panel included. */
  readonly focusedWithin: Signal<boolean>;
  /** Host `(focusin)` handler. */
  handleFocusIn(): void;
  /** Host `(focusout)` handler; a move to another descendant is not a leave. */
  handleFocusOut(event: FocusEvent): void;
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
  };
}
