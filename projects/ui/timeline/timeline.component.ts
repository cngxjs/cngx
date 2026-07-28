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
  type TemplateRef,
} from '@angular/core';
import type { EmptyReason } from '@cngx/common/card';
import { resolveAsyncView } from '@cngx/common/data';
import {
  CNGX_TIMELINE_GROUPING_FACTORY,
  CngxTimelineDateHeader,
  CngxTimelineEmpty,
  CngxTimelineError,
  CngxTimelineItemTpl,
  CngxTimelineLoadingTail,
  CngxTimelineMarkerTpl,
  CngxTimelineRetryButton,
  injectTimelineConfig,
  type CngxTimelineDateHeaderContext,
  type CngxTimelineItemContext,
  type CngxTimelineMarkerContext,
  type TimelineDateAccessor,
  type TimelineDirection,
  type TimelineGroup,
  type TimelineGroupBy,
} from '@cngx/common/timeline';
import { CNGX_STATEFUL, nextUid, type CngxAsyncState } from '@cngx/core/utils';
import { CngxSkeletonContainer, CngxSkeletonPlaceholder } from '@cngx/ui/skeleton';

import { createForwardedAsyncState } from './forwarded-async-state';
import { resolveSlot } from './slot-cascade';

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
 * grouped renders `list` -> `group` (named by its date header) ->
 * `listitem`; `groupBy="none"` collapses to `list` -> `listitem`. The group
 * wrapper carries its role from day one so the v2 collapsible variant can
 * become a `<details role="group">` without moving the chain.
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
 *       <cngx-time cngxTimelineTime [value]="$any(event).at" />
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
    '[attr.aria-busy]': 'ariaBusy()',
  },
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.css',
})
export class CngxTimeline<T = unknown> {
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
  readonly state = input<CngxAsyncState<readonly T[]> | undefined>(undefined);

  /**
   * Why the timeline is empty, forwarded to `*cngxTimelineEmpty`. The
   * organism cannot infer this - only the consumer knows whether a filter
   * cleared the list or nothing has happened yet.
   */
  readonly emptyReason = input<EmptyReason>('first-use');

  /**
   * How many placeholder rows the loading body draws. Match it to the
   * timeline's usual length so the skeleton reserves roughly the space the
   * content will take.
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
   * Stable event identity. Supplying it makes a refetch that returns equal
   * data leave untouched bands at their previous references, so the
   * unaffected parts of a long timeline do not re-render.
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

  // contentChild as a direct field initialiser - AOT (NG8110) rejects these
  // from a helper, which is why the slot cascade is spelled out rather than
  // pushed into a registry factory.
  private readonly itemSlot = contentChild(CngxTimelineItemTpl);
  private readonly dateHeaderSlot = contentChild(CngxTimelineDateHeader);
  private readonly markerSlot = contentChild(CngxTimelineMarkerTpl);
  private readonly emptySlot = contentChild(CngxTimelineEmpty);
  private readonly errorSlot = contentChild(CngxTimelineError);
  private readonly retryButtonSlot = contentChild(CngxTimelineRetryButton);
  private readonly loadingTailSlot = contentChild(CngxTimelineLoadingTail);

  /** @internal The list the presenter groups: bound state first, then `[items]`. */
  protected readonly resolvedItems = computed<readonly T[]>(
    () => this.state()?.data() ?? this.items(),
  );

  private readonly grouping = this.groupingFactory<T>({
    items: this.resolvedItems,
    dateAccessor: (item) => this.dateAccessor()(item),
    groupBy: this.groupBy,
    direction: this.direction,
    idAccessor: (item) => this.idAccessor()?.(item) ?? item,
  });

  /** The derived bands, in sort order. */
  readonly groups: Signal<readonly TimelineGroup<T>[]> = this.grouping.groups;

  /**
   * @internal Seven slots, one cascade rule: instance slot -> config default
   * -> null. The config tier is typed against `unknown` items while the slots
   * are generic, hence the casts - `TemplateRef` is method-bivariant, so a
   * consumer's concrete template still assigns in.
   */
  protected readonly itemTpl = resolveSlot(
    this.itemSlot,
    () => this.config.templates?.item as TemplateRef<CngxTimelineItemContext<T>> | undefined,
  );
  protected readonly dateHeaderTpl = resolveSlot(
    this.dateHeaderSlot,
    () =>
      this.config.templates?.dateHeader as
        | TemplateRef<CngxTimelineDateHeaderContext<T>>
        | undefined,
  );
  protected readonly markerTpl = resolveSlot(
    this.markerSlot,
    () => this.config.templates?.marker as TemplateRef<CngxTimelineMarkerContext<T>> | undefined,
  );
  protected readonly emptyTpl = resolveSlot(this.emptySlot, () => this.config.templates?.empty);
  protected readonly errorTpl = resolveSlot(this.errorSlot, () => this.config.templates?.error);
  protected readonly retryButtonTpl = resolveSlot(
    this.retryButtonSlot,
    () => this.config.templates?.retryButton,
  );
  protected readonly loadingTailTpl = resolveSlot(
    this.loadingTailSlot,
    () => this.config.templates?.loadingTail,
  );

  /**
   * Forwarding façade over the bound `[state]`, published through
   * `CNGX_STATEFUL`. Every member delegates, so swapping the bound state (or
   * binding none at all) never leaves a bridge holding a stale object.
   */
  readonly asyncState: CngxAsyncState<readonly T[]> = createForwardedAsyncState(this.state);

  /**
   * @internal The whole body switch, derived - there is no second state
   * machine here and no boolean fallback inputs. With no `[state]` bound the
   * timeline is a plain list, so it reports content and lets `[items]` speak.
   */
  protected readonly activeView = computed(() => {
    const state = this.state();
    if (!state) {
      return 'content' as const;
    }
    return resolveAsyncView(state.status(), state.isFirstLoad(), this.groups().length === 0);
  });

  /** @internal Content is on screen, whether or not an error rides along. */
  protected readonly showsContent = computed(
    () => this.activeView() === 'content' || this.activeView() === 'content+error',
  );

  /** @internal A background refresh over content the user can still read. */
  protected readonly refreshing = computed(
    () => this.showsContent() && (this.state()?.isRefreshing() ?? false),
  );

  /** @internal Mirrors the bound state's own busy flag. */
  protected readonly ariaBusy = computed(() => (this.state()?.isBusy() ? 'true' : null));

  /** @internal Passed into the error and retry-button slot contexts. */
  protected readonly emitRetry = (): void => this.retry.emit();

  /**
   * @internal `groupBy: 'none'` still produces one synthetic band from the
   * presenter, so the ungrouped configuration is a rendering decision here
   * rather than a second data path.
   */
  protected readonly ungrouped = computed(() => this.groupBy() === 'none');

  /** @internal `null` in the ungrouped chain, so it reads `list -> listitem`. */
  protected readonly groupRole = computed(() => (this.ungrouped() ? null : 'group'));

  /** @internal Config fallback only applies when nothing was named explicitly. */
  protected readonly listLabel = computed(() =>
    this.ariaLabelledBy() ? null : (this.ariaLabel() ?? this.config.labels?.timelineRegion ?? null),
  );

  /** @internal A group is named by its own header element. */
  protected groupLabelId(group: TimelineGroup<T>): string {
    return `${this.uid}-group-${group.key}`;
  }

  /** @internal Fallback header text when no `*cngxTimelineDateHeader` is bound. */
  protected groupLabel(group: TimelineGroup<T>): string {
    return this.config.labels?.groupLabel?.(group) ?? group.key;
  }

  /** @internal Fallback copy, all from the config cascade. */
  protected label(key: 'retry' | 'errorFallback' | 'emptyFallback' | 'loading' | 'refreshing'): string {
    return this.config.labels?.[key] ?? '';
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
