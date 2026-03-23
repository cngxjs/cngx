import { DOCUMENT } from '@angular/common';
import {
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { combineLatest } from 'rxjs';

/**
 * Observes whether the host element is visible in the viewport or a scroll container.
 *
 * Wraps the browser's `IntersectionObserver` API and exposes its state as
 * Angular signals. The observer is automatically recreated when `root`,
 * `rootMargin`, or `threshold` inputs change, and disconnected on destroy.
 *
 * Use cases: lazy loading images, infinite scroll sentinels, scroll-triggered
 * animations, "back to top" buttons, analytics viewport tracking.
 *
 * @usageNotes
 *
 * ### Lazy load sentinel
 * ```html
 * <div cngxIntersectionObserver #io="cngxIntersectionObserver"
 *      (entered)="loadNextPage()">
 *   @if (io.isIntersecting()) { Loading... }
 * </div>
 * ```
 *
 * ### Scroll-triggered animation
 * ```html
 * <section cngxIntersectionObserver #io="cngxIntersectionObserver"
 *          [threshold]="0.5"
 *          [class.visible]="io.isIntersecting()">
 *   Content fades in at 50% visibility
 * </section>
 * ```
 *
 * ### Custom scroll container
 * ```html
 * <div cngxIntersectionObserver [root]="'.scroll-container'" [rootMargin]="'100px'">
 *   Observed within a scrollable parent
 * </div>
 * ```
 */
@Directive({
  selector: '[cngxIntersectionObserver]',
  exportAs: 'cngxIntersectionObserver',
  standalone: true,
})
export class CngxIntersectionObserver {
  /**
   * CSS selector for the scroll container to use as the root.
   * `null` (default) uses the viewport.
   */
  /** CSS selector for the scroll container root. `null` (default) uses the viewport. */
  readonly root = input<string | null>(null);
  /** Margin around the root, using CSS margin syntax (e.g. `'100px 0px'`). */
  readonly rootMargin = input<string>('0px');
  /** Visibility ratio(s) at which the callback fires. `0` = any pixel visible, `1` = fully visible. */
  readonly threshold = input<number | number[]>(0);

  private readonly _entry = signal<IntersectionObserverEntry | null>(null);

  /** `true` when any part of the element is visible within the root. */
  readonly isIntersecting = computed(() => this._entry()?.isIntersecting ?? false);
  /** The fraction of the element currently visible (0–1). */
  readonly intersectionRatio = computed(() => this._entry()?.intersectionRatio ?? 0);

  /** Emitted on every intersection change with the raw `IntersectionObserverEntry`. */
  readonly intersectionChange = output<IntersectionObserverEntry>();
  /** Emitted once when the element enters the observed area. */
  readonly entered = output<void>();
  /** Emitted once when the element leaves the observed area. */
  readonly left = output<void>();

  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _doc = inject(DOCUMENT);
  private _observer: IntersectionObserver | null = null;

  constructor() {
    combineLatest([
      toObservable(this.root),
      toObservable(this.rootMargin),
      toObservable(this.threshold),
    ]).subscribe(([root, rootMargin, threshold]) => {
      this._buildObserver(root, rootMargin, threshold);
    });

    inject(DestroyRef).onDestroy(() => this._observer?.disconnect());
  }

  private _buildObserver(
    root: string | null,
    rootMargin: string,
    threshold: number | number[],
  ): void {
    this._observer?.disconnect();

    const resolvedRoot = root ? this._doc.querySelector(root) : null;

    this._observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const wasIntersecting = this._entry()?.isIntersecting ?? false;
        this._entry.set(entry);
        this.intersectionChange.emit(entry);
        if (entry.isIntersecting && !wasIntersecting) {
          this.entered.emit();
        }
        if (!entry.isIntersecting && wasIntersecting) {
          this.left.emit();
        }
      },
      { root: resolvedRoot, rootMargin, threshold },
    );

    this._observer.observe(this._el.nativeElement as HTMLElement);
  }
}
