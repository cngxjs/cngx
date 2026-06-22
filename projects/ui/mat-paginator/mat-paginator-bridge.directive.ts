import {
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  Renderer2,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatPaginator, type PageEvent } from '@angular/material/paginator';
import { CngxPaginate, connectPaginateResetOn } from '@cngx/common/data';

/**
 * Context handed to {@link CngxMatPaginator.announceLabel} to build the
 * screen-reader announcement after each page / page-size change.
 *
 * @category ui/mat-paginator
 */
export interface CngxMatPaginatorAnnounceContext {
  /** 1-based current page. */
  readonly page: number;
  /** Total page count (minimum 1). */
  readonly totalPages: number;
  /** 1-based index of the first item on the page. */
  readonly start: number;
  /** 1-based index of the last item on the page, capped at `total`. */
  readonly end: number;
  /** Total item count before pagination. */
  readonly total: number;
}

/** English default announcement. Localise via `[announceLabel]`. */
const defaultAnnounceLabel = (c: CngxMatPaginatorAnnounceContext): string =>
  `Page ${c.page} of ${c.totalPages}, showing items ${c.start} to ${c.end} of ${c.total}`;

/**
 * The in-place adoption half of the Material paginator instrumentation: add
 * `cngxMatPaginator` to an existing `<mat-paginator>` and the signal-native
 * {@link CngxPaginate} brain takes over its state with no DOM rewrite, mirroring
 * `[cngxMatStepper]` / `[cngxMatTabs]`.
 *
 * The bridge composes the untouched brain via `hostDirectives`, injects the
 * consumer's own `MatPaginator` with `{ self: true }`, and syncs the four
 * Material properties (`length` / `pageIndex` / `pageSize` / `disabled`) plus
 * `pageSizeOptions` against the brain's `computed()` graph, forwarding `(page)`
 * back into the brain.
 *
 * Beyond plain `<mat-paginator>`, the bridge adds:
 * - `[resetOn]` - jump to the first page whenever a bound key (a sort / filter /
 *   search value) changes, so a filtered result set never strands the user on a
 *   now-empty page. Pass a primitive (or a `computed` string key); an inline
 *   array literal recomputes every change-detection pass and would reset on each.
 * - `[announce]` - mount a visually-hidden `aria-live` region that speaks the new
 *   page + visible range after every change; `<mat-paginator>` only relabels its
 *   own range text, which AT does not announce. Localise via `[announceLabel]`.
 * - `[cngxPaginateRouting]` (generic companion directive from `@cngx/common/data`)
 *   - persist the page / size in the URL query string for deep-linkable,
 *   back-button-safe pagination.
 *
 * ```html
 * <mat-paginator
 *   cngxMatPaginator
 *   #pg="cngxMatPaginator"
 *   [total]="items.length"
 *   [pageSizeOptions]="[5, 10, 25]"
 * />
 * <ul>
 *   @for (item of items.slice(pg.paginate.range()[0], pg.paginate.range()[1]); track item.id) {
 *     <li>{{ item.label }}</li>
 *   }
 * </ul>
 * ```
 *
 * @category ui/mat-paginator
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/mat-paginator/mat-paginator-bridge.directive.ts
 * @since 0.1.0
 * @relatedTo CngxPaginate, CngxMatStepper, CngxPaginator
 */
@Directive({
  selector: '[cngxMatPaginator]',
  exportAs: 'cngxMatPaginator',
  standalone: true,
  host: {
    // MatPaginator disables its nav buttons on busy but says nothing about why;
    // aria-busy on the host communicates the updating state to AT, reactively.
    '[attr.aria-busy]': 'paginate.isBusy()',
  },
  hostDirectives: [
    {
      directive: CngxPaginate,
      inputs: ['cngxPageIndex', 'cngxPageSize', 'total', 'state'],
      outputs: ['pageChange', 'pageSizeChange'],
    },
  ],
})
export class CngxMatPaginator {
  private readonly matPaginator = inject(MatPaginator, { self: true });
  /**
   * The composed {@link CngxPaginate} brain. Public so a sibling list or table
   * outside the `<mat-paginator>` reads `range()` via `#ref="cngxMatPaginator"`.
   */
  readonly paginate = inject(CngxPaginate);

  /** Options for the page-size selector. A Material-render concern, owned here. */
  readonly pageSizeOptions = input<number[]>([5, 10, 25]);

  /**
   * Reset key. When its value changes (after the initial render) the brain jumps
   * to the first page. Bind the sort / filter / search value a result set
   * depends on. Pass a primitive or a `computed` - an inline array / object
   * literal recomputes every change-detection pass and would reset every time.
   */
  readonly resetOn = input<unknown>(undefined, { alias: 'resetOn' });

  /** Speak page changes through a visually-hidden `aria-live` region when `true`. */
  readonly announce = input(false, { alias: 'announce' });

  /** Builds the announcement string. Defaults to an English template. */
  readonly announceLabel = input<(context: CngxMatPaginatorAnnounceContext) => string>(
    defaultAnnounceLabel,
    { alias: 'announceLabel' },
  );

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);

  /** The live-region message - derived, so it never drifts from brain state. */
  private readonly announceMessage = computed(() => {
    const total = this.paginate.total();
    const start = total === 0 ? 0 : this.paginate.range()[0] + 1;
    const end = Math.min(this.paginate.range()[1], total);
    return this.announceLabel()({
      page: this.paginate.pageIndex() + 1,
      totalPages: this.paginate.totalPages(),
      start,
      end,
      total,
    });
  });

  private liveRegion: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const length = this.paginate.total();
      const pageIndex = this.paginate.pageIndex();
      const pageSize = this.paginate.pageSize();
      const busy = this.paginate.isBusy();
      const options = this.pageSizeOptions();
      untracked(() => {
        // `length` and `pageIndex` setters self-call markForCheck on
        // MatPaginator's OnPush view; writing them every run dirties the view
        // so the non-self-dirtying writes below flush in the same re-render -
        // including the disabled-only case where busy flips while page and
        // total hold. `pageSize` is written before `pageSizeOptions` so the
        // displayed-options merge keeps the active size selectable.
        this.matPaginator.length = length;
        this.matPaginator.pageSize = pageSize;
        this.matPaginator.pageSizeOptions = options;
        this.matPaginator.pageIndex = pageIndex;
        this.matPaginator.disabled = busy;
      });
    });

    this.matPaginator.page.pipe(takeUntilDestroyed()).subscribe((event: PageEvent) => {
      // setPageSize(..., false) suppresses the implicit page reset so the
      // explicit setPage below lands the index mat-paginator already computed.
      // No property setter emits `page`, so these brain writes never re-enter
      // through this subscription; the path is loop-free without an echo guard.
      this.paginate.setPageSize(event.pageSize, false);
      this.paginate.setPage(event.pageIndex);
    });

    // Reset-on-change, shared verbatim with the shell input and the generic
    // [cngxPaginateResetOn] directive.
    connectPaginateResetOn(this.paginate, this.resetOn);

    // AT announcement. The region is created lazily on first opt-in, then its
    // text tracks the derived message. textContent is written through the
    // renderer so it stays SSR-safe.
    effect(() => {
      if (!this.announce()) {
        return;
      }
      const message = this.announceMessage();
      untracked(() => {
        this.liveRegion ??= this.createLiveRegion();
        this.renderer.setProperty(this.liveRegion, 'textContent', message);
      });
    });

    this.destroyRef.onDestroy(() => this.liveRegion?.remove());
  }

  /** A visually-hidden polite live region appended to the host paginator. */
  private createLiveRegion(): HTMLElement {
    const span = this.renderer.createElement('span') as HTMLElement;
    this.renderer.addClass(span, 'cngx-mat-paginator-live');
    this.renderer.setAttribute(span, 'aria-live', 'polite');
    this.renderer.setAttribute(span, 'aria-atomic', 'true');
    this.renderer.setAttribute(span, 'role', 'status');
    // Inline sr-only - the bridge ships no stylesheet, so it cannot rely on a
    // visually-hidden class being present in the consumer's CSS.
    for (const [prop, value] of [
      ['position', 'absolute'],
      ['width', '1px'],
      ['height', '1px'],
      ['margin', '-1px'],
      ['padding', '0'],
      ['overflow', 'hidden'],
      ['clip', 'rect(0 0 0 0)'],
      ['clip-path', 'inset(50%)'],
      ['white-space', 'nowrap'],
      ['border', '0'],
    ]) {
      this.renderer.setStyle(span, prop, value);
    }
    this.renderer.appendChild(this.elementRef.nativeElement, span);
    return span;
  }
}
