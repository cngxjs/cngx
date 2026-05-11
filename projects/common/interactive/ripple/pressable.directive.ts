import { DestroyRef, Directive, inject, input, signal } from '@angular/core';

/**
 * Provides instant press feedback via CSS class on `pointerdown`.
 *
 * Click feedback fires too late — press feedback is immediate (0ms latency).
 * The class is removed on `pointerup` with an optional delay to prevent
 * a visual flash on quick taps.
 *
 * The directive only toggles the `cngx-pressed` class. All visual treatment
 * (scale, opacity, color) is the consumer's CSS responsibility.
 *
 * ```css
 * .cngx-pressed { transform: scale(0.97); }
 * ```
 *
 * @usageNotes
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
 * @category interactive
 */
@Directive({
  selector: '[cngxPressable]',
  exportAs: 'cngxPressable',
  standalone: true,
  host: {
    '[class.cngx-pressed]': 'pressed()',
    '(pointerdown)': 'handlePointerDown()',
    '(pointerup)': 'handlePointerUp()',
    '(pointercancel)': 'handlePointerCancel()',
    '(pointerleave)': 'handlePointerCancel()',
  },
})
export class CngxPressable {
  /** Minimum time in ms the pressed class stays active — prevents flash on quick taps. */
  readonly releaseDelay = input<number>(80, { alias: 'pressableReleaseDelay' });

  private readonly pressedState = signal(false);
  /** Whether the element is currently in the pressed state. */
  readonly pressed = this.pressedState.asReadonly();

  /** Pending timer handle for the delayed release. */
  private releaseTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Cancel any pending release timer on destroy to avoid writing to a dead directive.
    inject(DestroyRef).onDestroy(() => this.clearTimer());
  }

  /** @internal — sets pressed state immediately on pointer contact (0ms latency). */
  protected handlePointerDown(): void {
    this.clearTimer();
    this.pressedState.set(true);
  }

  /** @internal — releases after `releaseDelay` ms to prevent flash on quick taps. */
  protected handlePointerUp(): void {
    const delay = this.releaseDelay();
    if (delay > 0) {
      this.releaseTimer = setTimeout(() => this.pressedState.set(false), delay);
    } else {
      this.pressedState.set(false);
    }
  }

  /** @internal — immediate release on cancel/leave (no delay). */
  protected handlePointerCancel(): void {
    this.clearTimer();
    this.pressedState.set(false);
  }

  private clearTimer(): void {
    if (this.releaseTimer !== null) {
      clearTimeout(this.releaseTimer);
      this.releaseTimer = null;
    }
  }
}
