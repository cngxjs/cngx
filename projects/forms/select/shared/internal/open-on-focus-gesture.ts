/**
 * @internal
 *
 * One pointer press on a closed trigger fires `pointerdown`, then `focus`,
 * then `click`. Under `openOn: 'focus'` (or `'click+focus'`) the focus opens
 * the panel, so the click that belongs to the same press must not run
 * `toggle()` and snap it straight back closed. The press itself decides: a
 * press that starts on an unfocused trigger in a focus-open mode owns the
 * focus-open, so its click is swallowed. Every press overwrites that answer,
 * and a keyboard click (`detail === 0`) is never swallowed, so no flag
 * outlives the gesture it belongs to.
 *
 * Shared by the five button-trigger composites (single, multi, reorderable,
 * tree, shell).
 */
export interface CngxOpenOnFocusGestureOptions {
  /** Current `openOn` mode (read from the resolved select config). */
  readonly openOn: () => 'click' | 'focus' | 'click+focus' | undefined;
  /** Opens the panel. Typically `() => this.open()`. */
  readonly open: () => void;
  /**
   * `true` while an open-on-focus must be suppressed - the post-close focus
   * restore refocuses the trigger programmatically and must not reopen.
   */
  readonly suppress?: () => boolean;
}

export interface CngxOpenOnFocusGesture {
  /** Bind to the trigger's `(pointerdown)` with `$event`. */
  handlePointerDown(event: Event): void;
  /** Call from the trigger's focus handler; opens when `openOn` includes focus. */
  handleFocus(): void;
  /** `true` for the click of a press that focus-opened the panel; else `false`. */
  consumeClick(event: MouseEvent): boolean;
}

/** @internal */
export function isFocusOpenMode(mode: 'click' | 'focus' | 'click+focus' | undefined): boolean {
  return mode === 'focus' || mode === 'click+focus';
}

export function createOpenOnFocusGesture(
  opts: CngxOpenOnFocusGestureOptions,
): CngxOpenOnFocusGesture {
  let pressOpensOnFocus = false;
  return {
    handlePointerDown(event: Event): void {
      const trigger = event.currentTarget as Element | null;
      const focused = trigger?.ownerDocument.activeElement === trigger;
      pressOpensOnFocus = !focused && isFocusOpenMode(opts.openOn());
    },
    handleFocus(): void {
      if (isFocusOpenMode(opts.openOn()) && !(opts.suppress?.() ?? false)) {
        opts.open();
      }
    },
    consumeClick(event: MouseEvent): boolean {
      const swallow = pressOpensOnFocus && event.detail !== 0;
      pressOpensOnFocus = false;
      return swallow;
    },
  };
}
