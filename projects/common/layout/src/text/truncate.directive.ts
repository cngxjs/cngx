import {
  afterNextRender,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

/**
 * Manages text truncation with expand/collapse state detection.
 *
 * Applies `-webkit-line-clamp` when collapsed and detects whether the text
 * is actually clamped (content overflows). Exposes `isClamped` so the consumer
 * can conditionally show a "Show more" toggle only when needed.
 *
 * The `expanded` state supports two-way binding (controlled + uncontrolled).
 *
 * @usageNotes
 *
 * ### Basic truncation with toggle
 * ```html
 * <p [cngxTruncate]="3" [(expanded)]="expanded" #trunc="cngxTruncate">
 *   Long text content that may or may not overflow…
 * </p>
 * @if (trunc.isClamped() || trunc.expanded()) {
 *   <button (click)="expanded.set(!expanded())"
 *           [attr.aria-expanded]="expanded()">
 *     {{ expanded() ? 'Show less' : 'Show more' }}
 *   </button>
 * }
 * ```
 *
 * @category layout
 */
@Directive({
  selector: '[cngxTruncate]',
  exportAs: 'cngxTruncate',
  standalone: true,
  host: {
    '[style.-webkit-line-clamp]': 'clampValue()',
    '[style.display]': 'displayValue()',
    '[style.-webkit-box-orient]': 'orientValue()',
    '[style.overflow]': 'overflowValue()',
  },
})
export class CngxTruncate {
  /** Maximum number of visible lines when collapsed. */
  readonly lines = input<number>(3, { alias: 'cngxTruncate' });
  /** Whether the text is expanded (full content visible). Supports two-way binding. */
  readonly expanded = model<boolean>(false);

  private readonly isClampedState = signal(false);
  /** Whether the text content actually exceeds the line limit and is being clamped. */
  readonly isClamped = this.isClampedState.asReadonly();

  private readonly el = inject(ElementRef<HTMLElement>);
  private observer: ResizeObserver | null = null;
  private rafHandle: number | null = null;

  // When collapsed, applies the CSS properties required for -webkit-line-clamp.
  // When expanded, bindings are removed (null = no attribute written).
  /** @internal */
  protected clampValue = () => (this.expanded() ? null : String(this.lines()));
  /** @internal */
  protected displayValue = () => (this.expanded() ? null : '-webkit-box');
  /** @internal */
  protected orientValue = () => (this.expanded() ? null : 'vertical');
  /** @internal */
  protected overflowValue = () => (this.expanded() ? null : 'hidden');

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      this.checkClamped();
      this.observer = new ResizeObserver(() => this.checkClamped());
      this.observer.observe(this.el.nativeElement as HTMLElement);
    });

    // Re-check after expanded/lines change; RAF ensures styles are applied first.
    effect(() => {
      this.expanded(); // track
      this.lines(); // track
      this.cancelRaf();
      this.rafHandle = requestAnimationFrame(() => this.checkClamped());
    });

    destroyRef.onDestroy(() => {
      this.observer?.disconnect();
      this.cancelRaf();
    });
  }

  private cancelRaf(): void {
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
  }

  /**
   * Compares `scrollHeight` vs `clientHeight` to detect overflow.
   * Only meaningful when collapsed — when expanded, the last known
   * clamped state is preserved (can't measure hypothetical clamp height
   * while showing full content).
   */
  private checkClamped(): void {
    const el = this.el.nativeElement as HTMLElement;
    if (this.expanded()) {
      return;
    }
    this.isClampedState.set(el.scrollHeight > el.clientHeight);
  }
}
