import { DestroyRef, Directive, inject, input, output, signal } from '@angular/core';

/**
 * Debounced hover-intent primitive. Turns raw pointer enter/leave into a
 * boolean signal that flips `true` only after the pointer has rested on the
 * host for `enterDelay` ms of continuous hover, and back to `false` after
 * `leaveDelay` ms of continuous un-hover.
 *
 * A pointer that merely passes over the host never fires: the pending timer
 * is cancelled by the opposite event before it elapses. Use it for
 * hover-to-reveal panels, hover-to-prefetch triggers, or any affordance that
 * reads as nervous when it reacts to an instant `mouseenter`.
 *
 * The `active` signal is read-only - it is derived from pointer events and is
 * never consumer-writable, so it is exposed via `asReadonly()` plus an
 * `intentChange` output rather than a two-way `model()`. Pointer-only, no
 * keyboard surface: hover intent is a mouse concept and carries no ARIA.
 *
 * ### Hover to reveal
 * ```html
 * <div cngxHoverIntent #hi="cngxHoverIntent" [enterDelay]="150">
 *   <span>Card</span>
 *   @if (hi.active()) { <div class="detail">…</div> }
 * </div>
 * ```
 *
 * ### Bind the edge
 * ```html
 * <a cngxHoverIntent (intentChange)="$event && prefetch()">Link</a>
 * ```
 *
 * @category common/interactive
 * @docsKind primary
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/hover-intent/hover-intent.directive.ts
 * @since 0.1.0
 * @relatedTo CngxHoverable, CngxLongPress, CngxExpandable
 * <example-url>http://localhost:4200/#/common/interactive/hover-intent/hover-to-reveal</example-url>
 */
@Directive({
  selector: '[cngxHoverIntent]',
  exportAs: 'cngxHoverIntent',
  standalone: true,
  host: {
    '(pointerenter)': 'handleEnter()',
    '(pointerleave)': 'handleLeave()',
  },
})
export class CngxHoverIntent {
  /** ms of continuous hover before `active` settles to `true`. */
  readonly enterDelay = input<number>(120);
  /** ms of continuous un-hover before `active` settles back to `false`. */
  readonly leaveDelay = input<number>(0);

  private readonly intentState = signal(false);
  /** Debounced hover-intent state. `true` only after `enterDelay` ms of continuous hover. */
  readonly active = this.intentState.asReadonly();

  /** Emitted on every debounced edge: `true` on settle-in, `false` on settle-out. */
  readonly intentChange = output<boolean>();

  private pendingTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearPending());
  }

  protected handleEnter(): void {
    this.schedule(true, this.enterDelay());
  }

  protected handleLeave(): void {
    this.schedule(false, this.leaveDelay());
  }

  private schedule(target: boolean, delay: number): void {
    this.clearPending();
    this.pendingTimer = setTimeout(() => {
      this.pendingTimer = undefined;
      if (this.intentState() === target) {
        return;
      }
      this.intentState.set(target);
      this.intentChange.emit(target);
    }, delay);
  }

  private clearPending(): void {
    if (this.pendingTimer !== undefined) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = undefined;
    }
  }
}
