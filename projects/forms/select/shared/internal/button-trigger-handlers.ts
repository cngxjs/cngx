import type { CngxTriggerFocusState } from '../trigger-focus';
import { createOpenOnFocusGesture } from './open-on-focus-gesture';

/** @internal */
export interface CngxButtonTriggerHandlersOptions {
  readonly focusState: Pick<CngxTriggerFocusState, 'markFocused' | 'markBlurred'>;
  /** Current `openOn` mode (read from the resolved select config). */
  readonly openOn: () => 'click' | 'focus' | 'click+focus' | undefined;
  readonly open: () => void;
  /** The component's public `toggle()`. */
  readonly toggle: () => void;
  /** `true` inside the post-close focus restore, which must not reopen under `openOn: 'focus'`. */
  readonly suppressOpenOnFocus: () => boolean;
  readonly disabled: () => boolean;
}

/** @internal */
export interface CngxButtonTriggerHandlers {
  /** Bind to the trigger's `(pointerdown)` with `$event`. */
  readonly handlePointerDown: (event: Event) => void;
  /** Bind to the trigger's `(click)` with `$event`. */
  readonly handleTriggerClick: (event: MouseEvent) => void;
  /** Bind to the trigger's `(focus)`. */
  readonly handleFocus: () => void;
  /** Bind to the trigger's `(blur)`. */
  readonly handleBlur: () => void;
}

/**
 * Pointer, click, focus and blur handlers of the five button-trigger
 * composites (single, multi, reorderable, tree, shell). A click that belongs
 * to a press which focus-opened the panel skips `toggle()`, see
 * `createOpenOnFocusGesture`.
 */
export function createButtonTriggerHandlers(
  opts: CngxButtonTriggerHandlersOptions,
): CngxButtonTriggerHandlers {
  const gesture = createOpenOnFocusGesture({
    openOn: opts.openOn,
    open: opts.open,
    suppress: opts.suppressOpenOnFocus,
  });
  return {
    handlePointerDown(event: Event): void {
      gesture.handlePointerDown(event);
    },
    handleTriggerClick(event: MouseEvent): void {
      if (opts.disabled()) {
        return;
      }
      if (gesture.consumeClick(event)) {
        return;
      }
      opts.toggle();
    },
    handleFocus(): void {
      opts.focusState.markFocused();
      gesture.handleFocus();
    },
    handleBlur(): void {
      opts.focusState.markBlurred();
    },
  };
}
