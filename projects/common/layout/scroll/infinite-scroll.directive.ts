import { DOCUMENT } from '@angular/common';
import {
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  isDevMode,
  output,
  untracked,
  type Signal,
} from '@angular/core';
import { createTransitionTracker } from '@cngx/core/utils';

/**
 * Infinite scroll trigger using `IntersectionObserver`.
 *
 * Place on a sentinel element at the bottom of a list. Fires `loadMore`
 * when the sentinel enters the viewport. Includes a debounce guard and
 * a `loading` input to prevent re-triggers during fetch.
 *
 * The observer is automatically recreated when `root`, `rootMargin`, or
 * `threshold` inputs change, and disconnected on destroy or when `enabled`
 * is set to `false`. When `loading` settles back to `false` the sentinel is
 * re-observed, so a fetched page that did not push the sentinel out of view
 * still re-fires `loadMore` instead of stalling the list.
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
 * @category common/layout
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/scroll/infinite-scroll.directive.ts
 * @since 0.1.0
 * @relatedTo CngxIntersectionObserver, CngxScrollSpy, CngxStickyHeader
 * <example-url>http://localhost:4200/#/common/layout/infinite-scroll/scrollable-list</example-url>
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
  private observer: IntersectionObserver | null = null;

  constructor() {
    const win = this.doc.defaultView;
    if (!win) {
      return;
    }

    effect((onCleanup) => {
      const enabled = this.enabled();
      const root = this.root();
      const rootMargin = this.rootMargin();
      const threshold = this.threshold();
      const debounceMs = this.debounceMs();

      if (!enabled) {
        return;
      }

      const isLoading = () => this.loading();
      const resolvedRoot = root ? this.doc.querySelector(root) : null;
      if (isDevMode() && root && !resolvedRoot) {
        console.warn(
          `[cngxInfiniteScroll] root selector "${root}" matched no element - ` +
            'falling back to the viewport. A late-rendered root needs a re-bind of [root].',
        );
      }

      const observer = new IntersectionObserver(
        (entries) => {
          // batched records arrive oldest-first; only the newest reflects reality
          const entry = entries[entries.length - 1];
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
      this.observer = observer;

      onCleanup(() => {
        observer.disconnect();
        this.observer = null;
      });
    });

    const loadingTransition = createTransitionTracker(() => this.loading());
    effect(() => {
      const loading = loadingTransition.current();
      const wasLoading = loadingTransition.previous();
      if (!wasLoading || loading) {
        return;
      }
      // IO reports intersection CHANGES only: when a fetched page does not
      // push the sentinel out of view there is no new entry after loading
      // settles, and the list stalls. Re-observing forces a fresh entry;
      // the debounce window is reset so that entry may emit immediately.
      untracked(() => {
        const sentinel = this.el.nativeElement as HTMLElement;
        this.lastEmitTime = 0;
        this.observer?.unobserve(sentinel);
        this.observer?.observe(sentinel);
      });
    });
  }
}
