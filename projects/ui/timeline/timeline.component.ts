import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  input,
  ViewEncapsulation,
  type Signal,
  type TemplateRef,
} from '@angular/core';
import {
  CNGX_TIMELINE_GROUPING_FACTORY,
  CngxTimelineDateHeader,
  CngxTimelineItemTpl,
  CngxTimelineMarkerTpl,
  injectTimelineConfig,
  type CngxTimelineDateHeaderContext,
  type CngxTimelineItemContext,
  type CngxTimelineMarkerContext,
  type TimelineDateAccessor,
  type TimelineDirection,
  type TimelineGroup,
  type TimelineGroupBy,
} from '@cngx/common/timeline';
import { nextUid } from '@cngx/core/utils';

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
  imports: [NgTemplateOutlet],
  host: {
    class: 'cngx-timeline',
    '[attr.data-mode]': 'mode()',
    '[attr.data-skin]': 'skin()',
  },
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.css',
})
export class CngxTimeline<T = unknown> {
  private readonly config = injectTimelineConfig();
  private readonly groupingFactory = inject(CNGX_TIMELINE_GROUPING_FACTORY);
  private readonly uid = nextUid('cngx-timeline');

  /** The flat event list. Order is irrelevant - the presenter sorts. */
  readonly items = input<readonly T[]>([]);

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

  private readonly grouping = this.groupingFactory<T>({
    items: this.items,
    dateAccessor: (item) => this.dateAccessor()(item),
    groupBy: this.groupBy,
    direction: this.direction,
    idAccessor: (item) => this.idAccessor()?.(item) ?? item,
  });

  /** The derived bands, in sort order. */
  readonly groups: Signal<readonly TimelineGroup<T>[]> = this.grouping.groups;

  /** @internal Three-stage cascade: instance slot -> config default -> null. */
  protected readonly itemTpl = computed<TemplateRef<CngxTimelineItemContext<T>> | null>(
    () =>
      this.itemSlot()?.templateRef ??
      (this.config.templates?.item as TemplateRef<CngxTimelineItemContext<T>> | undefined) ??
      null,
  );

  /** @internal */
  protected readonly dateHeaderTpl = computed<TemplateRef<
    CngxTimelineDateHeaderContext<T>
  > | null>(
    () =>
      this.dateHeaderSlot()?.templateRef ??
      (this.config.templates?.dateHeader as
        | TemplateRef<CngxTimelineDateHeaderContext<T>>
        | undefined) ??
      null,
  );

  /** @internal */
  protected readonly markerTpl = computed<TemplateRef<CngxTimelineMarkerContext<T>> | null>(
    () =>
      this.markerSlot()?.templateRef ??
      (this.config.templates?.marker as TemplateRef<CngxTimelineMarkerContext<T>> | undefined) ??
      null,
  );

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
