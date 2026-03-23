import { DOCUMENT } from '@angular/common';
import {
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

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
  /** CSS selector for the scroll container root. `null` (default) uses the viewport. */
  readonly root = input<string | null>(null);
  /** Margin around the root, using CSS margin syntax (e.g. `'100px 0px'`). */
  readonly rootMargin = input<string>('0px');
  /** Visibility ratio(s) at which the callback fires. `0` = any pixel visible, `1` = fully visible. */
  readonly threshold = input<number | number[]>(0);

  private readonly entryState = signal<IntersectionObserverEntry | null>(null);

  /** `true` when any part of the element is visible within the root. */
  readonly isIntersecting = computed(() => this.entryState()?.isIntersecting ?? false);
  /** The fraction of the element currently visible (0–1). */
  readonly intersectionRatio = computed(() => this.entryState()?.intersectionRatio ?? 0);

  /** Emitted on every intersection change with the raw `IntersectionObserverEntry`. */
  readonly intersectionChange = output<IntersectionObserverEntry>();
  /** Emitted once when the element enters the observed area. */
  readonly entered = output<void>();
  /** Emitted once when the element leaves the observed area. */
  readonly left = output<void>();

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly doc = inject(DOCUMENT);

  constructor() {
    const win = this.doc.defaultView;
    if (!win) {
      return;
    }

    effect((onCleanup) => {
      const root = this.root();
      const rootMargin = this.rootMargin();
      const threshold = this.threshold();
      const resolvedRoot = root ? this.doc.querySelector(root) : null;

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          const wasIntersecting = this.entryState()?.isIntersecting ?? false;
          this.entryState.set(entry);
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

      observer.observe(this.el.nativeElement as HTMLElement);

      onCleanup(() => observer.disconnect());
    });
  }
}
