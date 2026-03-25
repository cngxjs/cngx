import { DOCUMENT } from '@angular/common';
import {
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  output,
  type Signal,
} from '@angular/core';

/**
 * Infinite scroll trigger using `IntersectionObserver`.
 *
 * Place on a sentinel element at the bottom of a list. Fires `loadMore`
 * when the sentinel enters the viewport. Includes a debounce guard and
 * a `loading` input to prevent re-triggers during fetch.
 *
 * The observer is automatically recreated when `root`, `rootMargin`, or
 * `threshold` inputs change, and disconnected on destroy or when `enabled`
 * is set to `false`.
 *
 * @usageNotes
 *
 * ### Basic infinite list
 * ```html
 * <div class="item-list">
 *   @for (item of items(); track item.id) {
 *     <app-item [data]="item" />
 *   }
 *   <div cngxInfiniteScroll [loading]="isFetching()" (loadMore)="fetchNext()">
 *     @if (scroll.isLoading()) { <mat-spinner diameter="24" /> }
 *   </div>
 * </div>
 * ```
 *
 * ### Disable when all loaded
 * ```html
 * <div cngxInfiniteScroll
 *      [enabled]="hasNextPage()"
 *      [loading]="isFetching()"
 *      (loadMore)="fetchNext()">
 *   @if (!hasNextPage()) { <p>All items loaded</p> }
 * </div>
 * ```
 *
 * ### Custom scroll container with pre-fetch margin
 * ```html
 * <div cngxInfiniteScroll
 *      [root]="'.scroll-container'"
 *      [rootMargin]="'0px 0px 400px 0px'"
 *      [loading]="loading()"
 *      (loadMore)="loadMore()">
 * </div>
 * ```
 *
 * @category directives
 */
@Directive({
  selector: '[cngxInfiniteScroll]',
  standalone: true,
  exportAs: 'cngxInfiniteScroll',
  host: {
    class: 'cngx-infinite-scroll',
    '[class.cngx-infinite-scroll--loading]': 'isLoading()',
    '[attr.aria-busy]': 'isLoading() || null',
  },
})
export class CngxInfiniteScroll {
  /** IntersectionObserver threshold (0–1). */
  readonly threshold = input<number>(0);

  /** Pre-fetch margin. `'0px 0px 200px 0px'` triggers 200px before the sentinel is visible. */
  readonly rootMargin = input<string>('0px 0px 200px 0px');

  /** CSS selector for a custom scroll container root. `null` uses the viewport. */
  readonly root = input<string | null>(null);

  /** When `false`, the observer disconnects entirely. Use to stop loading when all items are fetched. */
  readonly enabled = input<boolean>(true);

  /** Set to `true` while fetching. Prevents re-trigger until the fetch completes. */
  readonly loading = input<boolean>(false);

  /** Minimum ms between consecutive `loadMore` emissions. */
  readonly debounceMs = input<number>(200);

  /** Emitted when the sentinel is visible, not loading, and debounce has elapsed. */
  readonly loadMore = output<void>();

  /** Readonly mirror of the `loading` input. */
  readonly isLoading: Signal<boolean> = computed(() => this.loading());

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly doc = inject(DOCUMENT);
  private lastEmitTime = 0;

  constructor() {
    const win = this.doc.defaultView;
    if (!win) {
      return;
    }

    effect((onCleanup) => {
      // Read all reactive inputs so the effect re-runs when any change
      const enabled = this.enabled();
      const root = this.root();
      const rootMargin = this.rootMargin();
      const threshold = this.threshold();
      const debounceMs = this.debounceMs();

      if (!enabled) {
        return;
      }

      // Snapshot loading as a closure-captured ref to the signal read
      const isLoading = () => this.loading();
      const resolvedRoot = root ? this.doc.querySelector(root) : null;

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry.isIntersecting) {
            return;
          }
          if (isLoading()) {
            return;
          }

          const now = Date.now();
          if (now - this.lastEmitTime < debounceMs) {
            return;
          }

          this.lastEmitTime = now;
          this.loadMore.emit();
        },
        { root: resolvedRoot, rootMargin, threshold },
      );

      observer.observe(this.el.nativeElement as HTMLElement);

      onCleanup(() => observer.disconnect());
    });
  }
}
