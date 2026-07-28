import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  input,
  output,
  ViewEncapsulation,
  type Signal,
} from '@angular/core';
import type { EmptyReason } from '@cngx/common/card';
import {
  CNGX_TIMELINE_GROUPING_FACTORY,
  CNGX_TIMELINE_MARKER_HOST,
  CngxTimelineDateHeader,
  CngxTimelineEmpty,
  CngxTimelineError,
  CngxTimelineItemTpl,
  CngxTimelineLoadingTail,
  CngxTimelineMarkerTpl,
  CngxTimelineRetryButton,
  CngxTimelineSkeleton,
  injectTimelineConfig,
  type CngxTimelineItemContext,
  type CngxTimelineMarkerHost,
  type TimelineDateAccessor,
  type TimelineDirection,
  type TimelineGroup,
  type TimelineGroupBy,
} from '@cngx/common/timeline';
import { CNGX_STATEFUL, nextUid, type CngxAsyncState } from '@cngx/core/utils';
import { CngxSkeletonContainer, CngxSkeletonPlaceholder } from '@cngx/ui/skeleton';

import { createForwardedAsyncState } from './forwarded-async-state';
import { createTimelineSlots } from './slot-cascade';
import { createTimelineFallbackCopy } from './timeline-labels';
import { CNGX_TIMELINE_VIEW_FACTORY } from './timeline-view';

/**
 * Raster the timeline lays its rows out on.
 *
 * `narrative` (default) stacks the timestamp above the body and gives each
 * event room to breathe - a history someone reads. `activity` trails the
 * timestamp after the body on one line - a feed someone scans. Purely
 * visual: same DOM, same ARIA, same slots, only the `[data-mode]` host
 * attribute changes.
 *
 * @category ui/timeline
 */
export type CngxTimelineMode = 'narrative' | 'activity';

/**
 * Visual skin, applied through `[data-skin]`. Thematic only - structure,
 * ARIA and slots are identical across all three.
 *
 * `line` (default) is the bare rail. `card` lifts each event body onto its
 * own surface. `bands` tints alternating groups so long timelines stay
 * scannable.
 *
 * @category ui/timeline
 */
export type CngxTimelineSkin = 'line' | 'card' | 'bands';

/**
 * Grouped, themed, RTL-safe timeline over a flat list of events.
 *
 * Data in, rows out: bind `[items]` and a `[dateAccessor]`, project one
 * `*cngxTimelineItem` template, and the organism buckets, sorts and renders
 * the rest. Bucketing is not its own code - it resolves
 * {@link CNGX_TIMELINE_GROUPING_FACTORY} and derives everything from one
 * `computed()`, so an app can swap in fiscal quarters or server-supplied
 * grouping without forking the component.
 *
 * **ARIA.** One chain in two configurations, both derived rather than set:
 * grouped is `group` -> `list` -> `listitem`, one list per band named by its
 * date header, so a screen reader counts items per band rather than across
 * the whole history. The header sits beside that list, never inside it - a
 * list may own nothing but `listitem`, and the header is a consumer slot.
 * `groupBy="none"` moves `list` up to the container and collapses the chain
 * to `list` -> `listitem`.
 *
 * **Not keyboard-navigable, deliberately.** v1 items are content, not
 * widgets - links and buttons *inside* a row are natively tabbable in DOM
 * order, which is the right behaviour for a read-only history. Roving
 * tabindex becomes mandatory the moment a row is selectable, and that is a
 * v2 concern.
 *
 * ```html
 * <cngx-timeline [items]="events()" [dateAccessor]="at" groupBy="day">
 *   <ng-template cngxTimelineItem let-event let-last="last">
 *     <cngx-timeline-item [position]="last ? 'last' : 'middle'">
 *       <cngx-time cngxTimelineTime [date]="$any(event).at" />
 *       <p>{{ $any(event).summary }}</p>
 *     </cngx-timeline-item>
 *   </ng-template>
 * </cngx-timeline>
 * ```
 *
 * @category ui/timeline
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/timeline/timeline.component.ts
 * @relatedTo CngxTimelineItem, CngxTimelineItemTpl, CNGX_TIMELINE_GROUPING_FACTORY, CNGX_TIMELINE_CONFIG
 * @since 0.1.0
 */
@Component({
  selector: 'cngx-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgTemplateOutlet, CngxSkeletonContainer, CngxSkeletonPlaceholder],
  providers: [
    // The rows render their own markers, so an app-wide marker template can
    // only reach them through a contract. A token, never the class itself:
    // a row has to stay usable with no timeline above it.
    { provide: CNGX_TIMELINE_MARKER_HOST, useExisting: CngxTimeline },
    {
      // Re-exposes whatever is bound to [state] so CngxToastOn / CngxAlertOn /
      // CngxBannerOn attach with no wiring at all. It cannot be `useExisting`
      // like the select family's: there the state is a concrete field, here it
      // arrives through an Input that can change or be absent, so the façade
      // below forwards each signal instead of capturing one object.
      provide: CNGX_STATEFUL,
      useFactory: (): { readonly state: CngxAsyncState<unknown> } => ({
        state: inject(CngxTimeline).asyncState,
      }),
    },
  ],
  host: {
    class: 'cngx-timeline',
    '[attr.data-mode]': 'mode()',
    '[attr.data-skin]': 'skin()',
    '[attr.data-ungrouped]': 'ungrouped() ? "" : null',
    // Aliased inputs leave the raw attribute behind, naming the role-less host.
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
  },
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.css',
})
export class CngxTimeline<T = unknown> implements CngxTimelineMarkerHost {
  private readonly config = injectTimelineConfig();
  private readonly groupingFactory = inject(CNGX_TIMELINE_GROUPING_FACTORY);
  private readonly uid = nextUid('cngx-timeline');

  /**
   * The flat event list. Order is irrelevant - the presenter sorts.
   * Ignored once `[state]` is bound.
   */
  readonly items = input<readonly T[]>([]);

  /**
   * The list's async state. Wins over `[items]`, and drives the whole body:
   * skeleton on first load, error surface with a retry, empty surface, and a
   * refreshing tail over content that stays on screen.
   *
   * Also republished through `CNGX_STATEFUL`, so a transition bridge inside
   * the timeline needs no binding of its own.
   */
  readonly state = input<
    CngxAsyncState<readonly T[]> | undefined,
    CngxAsyncState<readonly T[]> | '' | undefined
  >(undefined, { transform: (value) => (typeof value === 'string' ? undefined : value) });

  /**
   * Why the timeline is empty, forwarded to `*cngxTimelineEmpty`. The
   * organism cannot infer this - only the consumer knows whether a filter
   * cleared the list or nothing has happened yet.
   */
  readonly emptyReason = input<EmptyReason>('first-use');

  /**
   * How many placeholder rows the loading body draws. Match it to the usual
   * length so the skeleton reserves roughly the space the content will take.
   */
  readonly skeletonRowCount = input<number>(3);

  /** Fires when the consumer asks to retry a failed load. */
  readonly retry = output<void>();

  /**
   * Pulls the timestamp out of an event. Anything the `Date` constructor
   * accepts, so ISO strings off an API response need no pre-mapping.
   */
  readonly dateAccessor = input.required<TimelineDateAccessor<T>>();

  /**
   * Stable event identity, used as the `@for` track expression so a row
   * keeps its DOM across a refetch instead of being torn down and rebuilt.
   *
   * It deliberately does *not* drive band reuse: a refetch returns new
   * objects at the same ids, and reusing a band on an id match would pin it
   * to the old payload.
   */
  readonly idAccessor = input<((item: T) => unknown) | undefined>(undefined);

  /**
   * Bucketing. `'day'` (default), `'week'`, `'month'`, `'none'` for a flat
   * ungrouped list, or a custom function for anything else.
   */
  readonly groupBy = input<TimelineGroupBy<T>>('day');

  /** `'desc'` (default) is newest-first; `'asc'` reads oldest-first. */
  readonly direction = input<TimelineDirection>('desc');

  /** Row raster. See {@link CngxTimelineMode}. */
  readonly mode = input<CngxTimelineMode>('narrative');

  /** Visual skin. See {@link CngxTimelineSkin}. */
  readonly skin = input<CngxTimelineSkin>('line');

  /** Accessible name for the list. Falls back to the config's `timelineRegion`. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  /** Names the list from existing markup instead. Wins over `aria-label`. */
  readonly ariaLabelledBy = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  // Direct field initialisers, not a registry factory: AOT (NG8110) rejects
  // contentChild from a helper.
  private readonly itemSlot = contentChild(CngxTimelineItemTpl);
  private readonly dateHeaderSlot = contentChild(CngxTimelineDateHeader);
  private readonly markerSlot = contentChild(CngxTimelineMarkerTpl);
  private readonly emptySlot = contentChild(CngxTimelineEmpty);
  private readonly errorSlot = contentChild(CngxTimelineError);
  private readonly retryButtonSlot = contentChild(CngxTimelineRetryButton);
  private readonly loadingTailSlot = contentChild(CngxTimelineLoadingTail);
  private readonly skeletonSlot = contentChild(CngxTimelineSkeleton);

  /** @internal The list the presenter groups: bound state first, then `[items]`. */
  private readonly resolvedItems = computed<readonly T[]>(
    () => this.state()?.data() ?? this.items(),
  );

  private readonly grouping = this.groupingFactory<T>({
    items: this.resolvedItems,
    dateAccessor: (item) => this.dateAccessor()(item),
    groupBy: this.groupBy,
    direction: this.direction,
  });

  /** The derived bands, in sort order. */
  readonly groups: Signal<readonly TimelineGroup<T>[]> = this.grouping.groups;

  /** @internal Eight slots, one cascade rule, resolved in one place. */
  private readonly slots = createTimelineSlots<T>(
    {
      item: this.itemSlot,
      dateHeader: this.dateHeaderSlot,
      marker: this.markerSlot,
      empty: this.emptySlot,
      error: this.errorSlot,
      retryButton: this.retryButtonSlot,
      loadingTail: this.loadingTailSlot,
      skeleton: this.skeletonSlot,
    },
    () => this.config.templates,
  );

  protected readonly itemTpl = this.slots.item;
  protected readonly dateHeaderTpl = this.slots.dateHeader;
  /** Public: this is the `CNGX_TIMELINE_MARKER_HOST` contract the rows read. */
  readonly markerTpl = this.slots.marker;
  protected readonly emptyTpl = this.slots.empty;
  protected readonly errorTpl = this.slots.error;
  protected readonly retryButtonTpl = this.slots.retryButton;
  protected readonly loadingTailTpl = this.slots.loadingTail;
  protected readonly skeletonTpl = this.slots.skeleton;

  /**
   * Forwarding façade over the bound `[state]`, published through
   * `CNGX_STATEFUL`. Every member delegates, so swapping the bound state (or
   * binding none at all) never leaves a bridge holding a stale object.
   */
  readonly asyncState: CngxAsyncState<readonly T[]> = createForwardedAsyncState(this.state);

  /** @internal Fallback copy for every surface with no slot bound. */
  protected readonly labels = createTimelineFallbackCopy(this.config);

  /** @internal The body switch, the busy flag and the live-region text. */
  private readonly view = inject(CNGX_TIMELINE_VIEW_FACTORY)(
    this.state,
    () => this.groups().length === 0,
    this.labels,
  );

  protected readonly activeView = this.view.activeView;
  protected readonly showsContent = this.view.showsContent;
  protected readonly refreshing = this.view.refreshing;
  protected readonly ariaBusy = this.view.ariaBusy;
  protected readonly announcement = this.view.announcement;

  /** @internal Passed into the error and retry-button slot contexts. */
  protected readonly emitRetry = (): void => this.retry.emit();

  /**
   * @internal `groupBy: 'none'` still produces one synthetic band from the
   * presenter, so the ungrouped configuration is a rendering decision here
   * rather than a second data path.
   */
  protected readonly ungrouped = computed(() => this.groupBy() === 'none');

  /** @internal Grouped is `group -> list -> listitem`: one list per band. */
  protected readonly containerRole = computed(() => (this.ungrouped() ? 'list' : 'group'));

  /** @internal Generic when grouped so the header may sit beside the rows. */
  protected readonly wrapperRole = computed(() => (this.ungrouped() ? 'presentation' : null));

  /** @internal The rows are the list, so it owns only `listitem` children. */
  protected readonly rowsRole = computed(() => (this.ungrouped() ? 'presentation' : 'list'));

  /** @internal Config fallback only applies when nothing was named explicitly. */
  protected readonly listLabel = computed(() =>
    this.ariaLabelledBy() ? null : (this.ariaLabel() ?? this.config.labels?.timelineRegion ?? null),
  );

  /** @internal A group is named by its own header element, keyed on position. */
  protected groupLabelId(index: number): string {
    return `${this.uid}-group-${index}`;
  }

  /** @internal Row context. `first` / `last` are positions within the group. */
  protected itemContext(
    item: T,
    index: number,
    group: TimelineGroup<T>,
  ): CngxTimelineItemContext<T> {
    return {
      $implicit: item,
      index,
      first: index === 0,
      last: index === group.items.length - 1,
      group,
    };
  }

  /** @internal Track by consumer identity when given, else by reference. */
  protected trackItem = (index: number, item: T): unknown => this.idAccessor()?.(item) ?? item;
}
