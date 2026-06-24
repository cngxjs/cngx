import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { CngxInfiniteScroll } from '@cngx/common/layout';

import { injectPaginatorConfig } from '../paginator-config';
import { CNGX_PAGINATOR_HOST } from '../paginator-host.token';

/**
 * Infinite-scroll segment: a bottom-of-list sentinel that auto-advances the
 * page as it scrolls into view, composing `CngxInfiniteScroll`. \
 * The in-template sentinel binds the directive's `[enabled]` / `[loading]` inputs and its
 * `(loadMore)` output directly to the `CNGX_PAGINATOR_HOST` signals, so the
 * directive's built-in debounce, busy-gate, enabled-disable, and auto-disconnect
 * own the auto-advance double-fire guard - this segment adds no
 * `IntersectionObserver` code of its own.
 *
 * The directive sits on the sentinel element (not as a `hostDirective`) precisely so its `[enabled]` / `[loading]`
 * inputs can bind to the host-token signals; a static `hostDirectives`
 * declaration could not express that wiring.
 *
 * Like `cngx-pgn-load-more`, this stays a thin trigger atom: it injects
 * `CNGX_PAGINATOR_HOST`, holds no accumulation state, and renders no async view
 * of its own. \
 * The consumer slices its own array from the brain's
 * `cumulativeRange()`; the busy / error / end experience belongs to the consumer
 * or to a composing container, keeping the segment reusable unchanged.
 *
 * Exhausted state: once `host.isLast()` the sentinel disables (`enabled` is
 * `false`, so the observer disconnects). \
 * It swaps its busy affordance for the
 * `allLoaded` end label only after the final load settles (`!host.isBusy()`),
 * so it never claims "all loaded" while the last batch is still arriving, and
 * the tail is never a silent or stale spinner.
 *
 * `[root]` / `[rootMargin]` forward straight to the composed directive so a
 * consumer can point the sentinel at a bounded scroll container (a feed box)
 * rather than the viewport, and tune the pre-fetch distance. They are plain
 * passthrough config - the segment still owns no observer code and no state.
 *
 * @category ui/paginator
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/segments/paginator-infinite.component.ts
 * @since 0.1.0
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-parts/infinite/sentinel</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-modes/infinite</example-url>
 */
@Component({
  selector: 'cngx-pgn-infinite',
  exportAs: 'cngxPgnInfinite',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxInfiniteScroll],
  template: `
    <div
      class="cngx-paginator__infinite"
      cngxInfiniteScroll
      [enabled]="!host.isLast()"
      [loading]="host.isBusy()"
      [root]="root()"
      [rootMargin]="rootMargin()"
      (loadMore)="host.next()"
    >
      @if (isExhausted()) {
        <span class="cngx-paginator__infinite-end">{{ endLabel() }}</span>
      } @else {
        <span class="cngx-paginator__infinite-spinner" aria-hidden="true"></span>
        <span class="cngx-paginator__infinite-status">{{ busyLabel() }}</span>
      }
    </div>
  `,
  host: { class: 'cngx-paginator__segment' },
})
export class CngxPaginatorInfinite {
  protected readonly host = inject(CNGX_PAGINATOR_HOST);
  private readonly config = injectPaginatorConfig();

  /**
   * CSS selector for the scroll container the sentinel is watched within.
   * `null` (default) observes the viewport. Forwarded to `CngxInfiniteScroll`.
   */
  readonly root = input<string | null>(null);

  /**
   * Pre-fetch margin around the scroll container, forwarded to
   * `CngxInfiniteScroll`. The directive default loads ~200px before the
   * sentinel is visible.
   */
  readonly rootMargin = input<string>('0px 0px 200px 0px');

  /**
   * Exhausted: the last page is reached AND its load has settled. Gating on
   * `!isBusy()` keeps the spinner up while the final batch is still loading, so
   * the segment never claims "all loaded" before the last rows arrive.
   */
  protected readonly isExhausted = computed(() => this.host.isLast() && !this.host.isBusy());

  /**
   * Exhausted-state label from the config cascade, reused from the load-more
   * segment so both append modes speak the same "all N loaded" end state rather
   * than leaving the tail implicit.
   */
  protected readonly endLabel = computed(() => this.config.ariaLabels.allLoaded(this.host.total()));

  /** Status text shown beside the spinner while more pages remain. */
  protected readonly busyLabel = computed(() => this.config.announcements.loading);
}
