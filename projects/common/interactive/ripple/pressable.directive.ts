import { DestroyRef, Directive, inject, input, signal } from '@angular/core';

/**
 * Provides instant press feedback via CSS class on `pointerdown`.
 *
 * Click feedback fires too late - press feedback is immediate (0ms latency).
 * The class is removed on `pointerup` with an optional delay to prevent
 * a visual flash on quick taps. Space and Enter on the host itself press it
 * the same way until the key is released, so a `div role="button"` shows
 * the pressed state a native button gets from `:active`.
 *
 * The directive only toggles the `cngx-pressed` class. The button family
 * (`cngxButton`, `cngxIconButton`, `cngxCloseButton`) styles it as its
 * pressed state; on any other host the visual treatment (scale, opacity,
 * color) is the consumer's CSS responsibility.
 *
 * ```css
 * .cngx-pressed { transform: scale(0.97); }
 * ```
 *
 * ### Button with press feedback
 * ```html
 * <button cngxPressable>Click me</button>
 * ```
 *
 * ### Card with custom delay
 * ```html
 * <div cngxPressable [pressableReleaseDelay]="120" class="card">
 *   Tappable card
 * </div>
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/ripple/pressable.directive.ts
 * @since 0.3.0
 * @relatedTo CngxRipple, CngxPressRipple, CngxHoverable
 * <example-url>/#/common/interactive/gestures/pressable/press-feedback-on-buttons</example-url>
 * <example-url>/#/common/interactive/gestures/pressable/tappable-card</example-url>
 * @axis level atom
 */
@Directive({
  selector: '[cngxPressable]',
  exportAs: 'cngxPressable',
  standalone: true,
  host: {
    '[class.cngx-pressed]': 'pressed()',
    '(pointerdown)': 'handlePointerDown($event)',
    '(pointerup)': 'handlePointerUp()',
    '(pointercancel)': 'handlePointerCancel()',
    '(pointerleave)': 'handlePointerLeave()',
    '(keydown)': 'handleKeyDown($event)',
    '(keyup)': 'handleKeyUp($event)',
    '(blur)': 'handleBlur()',
  },
})
export class CngxPressable {
  /** Minimum time in ms the pressed class stays active - prevents flash on quick taps. */
  readonly releaseDelay = input<number>(80, { alias: 'pressableReleaseDelay' });

  private readonly pressedState = signal(false);
  /** Whether the element is currently in the pressed state. */
  readonly pressed = this.pressedState.asReadonly();

  /** Pending timer handle for the delayed release. */
  private releaseTimer: ReturnType<typeof setTimeout> | null = null;

  /** Whether a pointer is down on the host (between pointerdown and pointerup/cancel). */
  private pointerDown = false;

  /** Whether Space or Enter is held on the host. */
  private keyDown = false;

  constructor() {
    // Cancel any pending release timer on destroy to avoid writing to a dead directive.
    inject(DestroyRef).onDestroy(() => this.clearTimer());
  }

  /** @internal - sets pressed state immediately on pointer contact (0ms latency). */
  protected handlePointerDown(event: PointerEvent): void {
    // Primary button only, like CngxRipple: a right-click opens a context menu.
    if (event.button !== 0) {
      return;
    }
    this.clearTimer();
    this.pointerDown = true;
    this.pressedState.set(true);
  }

  /** @internal - releases after `releaseDelay` ms to prevent flash on quick taps. */
  protected handlePointerUp(): void {
    this.pointerDown = false;
    this.clearTimer();
    const delay = this.releaseDelay();
    if (delay > 0) {
      this.releaseTimer = setTimeout(() => this.pressedState.set(false), delay);
    } else {
      this.pressedState.set(false);
    }
  }

  /** @internal - immediate release on cancel (no delay). */
  protected handlePointerCancel(): void {
    this.pointerDown = false;
    this.clearTimer();
    this.pressedState.set(false);
  }

  /** @internal - Space / Enter on the host itself press it; keys from descendants do not. */
  protected handleKeyDown(event: KeyboardEvent): void {
    if (!isActivationKey(event) || event.repeat || event.target !== event.currentTarget) {
      return;
    }
    this.clearTimer();
    this.keyDown = true;
    this.pressedState.set(true);
  }

  /** @internal - releases the keyboard press with the same delay as `pointerup`. */
  protected handleKeyUp(event: KeyboardEvent): void {
    if (!isActivationKey(event) || !this.keyDown) {
      return;
    }
    this.keyDown = false;
    this.handlePointerUp();
  }

  /** @internal - focus leaving with a key held cancels the keyboard press. */
  protected handleBlur(): void {
    if (this.keyDown) {
      this.keyDown = false;
      this.handlePointerCancel();
    }
  }

  /**
   * @internal - leaving with the pointer down cancels the press. On touch,
   * `pointerleave` follows `pointerup`; the pending delayed release stays.
   */
  protected handlePointerLeave(): void {
    if (this.pointerDown) {
      this.handlePointerCancel();
    }
  }

  private clearTimer(): void {
    if (this.releaseTimer !== null) {
      clearTimeout(this.releaseTimer);
      this.releaseTimer = null;
    }
  }
}

function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === ' ' || event.key === 'Enter';
}
