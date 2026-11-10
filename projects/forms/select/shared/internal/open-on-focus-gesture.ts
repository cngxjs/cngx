/**
 * @internal
 *
 * One pointer press on a closed trigger fires `pointerdown`, then `focus`,
 * then `click`. Under `openOn: 'focus'` (or `'click+focus'`) the focus opens
 * the panel, so the click that belongs to the same press must not run
 * `toggle()` and snap it straight back closed. This guard marks the gesture
 * on the focus that a pointerdown preceded and swallows exactly that one
 * click; a keyboard focus (no pointerdown) and a later deliberate click both
 * toggle normally.
 *
 * Shared by the five button-trigger composites (single, multi, reorderable,
 * tree, shell); `Phase 7` folds the call sites into the button-trigger
 * factory.
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
  /** Bind to the trigger's `(pointerdown)`. */
  handlePointerDown(): void;
  /** Call from the trigger's focus handler; opens when `openOn` includes focus. */
  handleFocus(): void;
  /** `true` once for the click of a pointer-initiated focus-open; else `false`. */
  consumeClick(): boolean;
}

export function createOpenOnFocusGesture(
  opts: CngxOpenOnFocusGestureOptions,
): CngxOpenOnFocusGesture {
  let pointerInitiated = false;
  let skipNextClick = false;
  return {
    handlePointerDown(): void {
      pointerInitiated = true;
    },
    handleFocus(): void {
      const mode = opts.openOn();
      const openOnFocus = mode === 'focus' || mode === 'click+focus';
      if (openOnFocus && !(opts.suppress?.() ?? false)) {
        opts.open();
        if (pointerInitiated) {
          skipNextClick = true;
        }
      }
      pointerInitiated = false;
    },
    consumeClick(): boolean {
      if (skipNextClick) {
        skipNextClick = false;
        return true;
      }
      return false;
    },
  };
}
