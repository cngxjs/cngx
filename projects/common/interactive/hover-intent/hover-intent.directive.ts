import {
  DestroyRef,
  Directive,
  inject,
  InjectionToken,
  input,
  output,
  signal,
} from '@angular/core';

/**
 * Optional app-wide defaults for `CngxHoverIntent`'s dwell timings. Provide it
 * to move the `enterDelay` / `leaveDelay` fallbacks an organism composes the
 * atom with, without touching the per-instance input surface. Every key is
 * optional - an unset key keeps the atom's literal (120 / 0).
 *
 * @category common/interactive
 * @since 0.1.0
 */
export interface CngxHoverIntentDefaults {
  /** Fallback for `enterDelay` (ms) when the input is not bound. */
  readonly enterDelay?: number;
  /** Fallback for `leaveDelay` (ms) when the input is not bound. */
  readonly leaveDelay?: number;
}

/**
 * Optional DI fallback for `CngxHoverIntent`'s `enterDelay` / `leaveDelay`
 * input defaults. Resolution is `bound input -> injected default -> literal`
 * (120 / 0). A hostDirective input default cannot be overridden by the host
 * that composes it, so this token is the layered extension point any
 * hover-to-reveal organism uses to set app-wide dwell defaults. `optional`, so
 * standalone `[cngxHoverIntent]` stays byte-identical when the token is absent.
 *
 * @category common/interactive
 * @relatedTo CngxHoverIntent
 * @since 0.1.0
 */
export const CNGX_HOVER_INTENT_DEFAULTS = new InjectionToken<CngxHoverIntentDefaults>(
  'CNGX_HOVER_INTENT_DEFAULTS',
);

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
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/hover-intent/hover-intent.directive.ts
 * @since 0.1.0
 * @relatedTo CngxHoverable, CngxLongPress, CngxExpandable
 * <example-url>http://localhost:4200/#/common/interactive/hover-intent/hover-to-reveal</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/hover-intent/hover-to-prefetch</example-url>
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
  /**
   * Optional app-wide dwell defaults. Declared first so the input initialisers
   * below can source their fallback from it. Absent by default - standalone
   * `[cngxHoverIntent]` then keeps the 120 / 0 literals.
   */
  private readonly defaults = inject(CNGX_HOVER_INTENT_DEFAULTS, { optional: true });

  /** ms of continuous hover before `active` settles to `true`. */
  readonly enterDelay = input<number>(this.defaults?.enterDelay ?? 120);
  /** ms of continuous un-hover before `active` settles back to `false`. */
  readonly leaveDelay = input<number>(this.defaults?.leaveDelay ?? 0);

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
