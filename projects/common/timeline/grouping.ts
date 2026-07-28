import { InjectionToken, linkedSignal, type Signal } from '@angular/core';

/**
 * One rendered band of a timeline - a calendar bucket plus the items that
 * fall into it, already sorted.
 *
 * The group carries no label: formatting a date is a locale concern that
 * belongs to the `*cngxTimelineDateHeader` slot (or the config's
 * `groupLabel` fallback), not to the presenter. `key` is stable and
 * collision-free across the built-in groupers, so it doubles as the
 * `@for` track expression and as the `aria-labelledby` id seed.
 *
 * @category common/timeline
 */
export interface TimelineGroup<T> {
  /** Stable bucket identity, e.g. `2026-07-27` for `day`. */
  readonly key: string;
  /**
   * Local start-of-bucket instant - midnight for `day`, the Monday for
   * `week`, the first of the month for `month`. For `'none'` it is the
   * date of the first item in sort order.
   */
  readonly start: Date;
  /** Items in this bucket, in the resolved sort direction. */
  readonly items: readonly T[];
}

/**
 * What a {@link TimelineGroupingFn} returns for a single item: the bucket
 * it belongs to, and the instant that bucket starts at.
 *
 * @category common/timeline
 */
export interface TimelineGroupKey {
  readonly key: string;
  readonly start: Date;
}

/**
 * Escape hatch for consumer-defined bucketing - UTC days, fiscal quarters,
 * sprint windows, "today / this week / earlier". Receives the coerced date
 * and the item it came from, so a grouper may key off payload fields
 * (tenant, channel) as well as time.
 *
 * Called once per item per recomputation; keep it pure and cheap.
 *
 * @category common/timeline
 */
export type TimelineGroupingFn<T> = (date: Date, item: T) => TimelineGroupKey;

/**
 * Built-in bucketing modes plus the {@link TimelineGroupingFn} escape
 * hatch. The three calendar modes read **local** date fields, so they stay
 * correct across DST transitions where a day is 23 or 25 hours long -
 * epoch division would silently split or merge those days.
 *
 * `'none'` collapses everything into one synthetic group, which is how the
 * organism renders an ungrouped `role="list"` without a second code path.
 *
 * @category common/timeline
 */
export type TimelineGroupBy<T> = 'day' | 'week' | 'month' | 'none' | TimelineGroupingFn<T>;

/**
 * Sort direction for the whole timeline. `'desc'` (default) is
 * newest-first, the activity-feed convention; `'asc'` is oldest-first,
 * which reads better for narrative histories.
 *
 * @category common/timeline
 */
export type TimelineDirection = 'asc' | 'desc';

/**
 * Pulls the timestamp out of a consumer item. Anything the `Date`
 * constructor accepts works, so ISO strings straight off an API response
 * need no pre-mapping.
 *
 * @category common/timeline
 */
export type TimelineDateAccessor<T> = (item: T) => Date | string | number;

/**
 * Inputs to {@link createTimelineGrouping}. Every reactive knob is a
 * zero-arg accessor, so a `Signal` (or an `input()`) can be passed
 * directly and a constant is just `() => 'day'`.
 *
 * @category common/timeline
 */
export interface TimelineGroupingOptions<T> {
  /** Source list. Read inside the `groups` computation, so it is tracked. */
  readonly items: () => readonly T[];
  /**
   * Timestamp accessor. Not a signal itself, but it is called inside the
   * `groups` computation, so a caller that closes over one - as the organism
   * does over its `[dateAccessor]` input - has those reads tracked like any
   * other and re-groups when the accessor is rebound.
   */
  readonly dateAccessor: TimelineDateAccessor<T>;
  /** Bucketing mode. Defaults to `'day'`. */
  readonly groupBy?: () => TimelineGroupBy<T>;
  /** Sort direction. Defaults to `'desc'`. */
  readonly direction?: () => TimelineDirection;
}

/**
 * What {@link createTimelineGrouping} hands back. An object rather than a
 * bare `Signal` because the v2 live cursor extends this surface - callers
 * written against v1 keep compiling.
 *
 * @category common/timeline
 */
export interface TimelineGrouping<T> {
  readonly groups: Signal<readonly TimelineGroup<T>[]>;
}

interface Bucket<T> {
  readonly start: Date;
  readonly items: T[];
}

function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}

function groupByDay(date: Date): TimelineGroupKey {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  return {
    key: `${year}-${pad2(month + 1)}-${pad2(day)}`,
    start: new Date(year, month, day),
  };
}

function groupByWeek(date: Date): TimelineGroupKey {
  // ISO weeks start on Monday; `getDay()` starts on Sunday.
  const offset = (date.getDay() + 6) % 7;
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset);
  return {
    key: `W${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`,
    start,
  };
}

function groupByMonth(date: Date): TimelineGroupKey {
  const year = date.getFullYear();
  const month = date.getMonth();
  return { key: `${year}-${pad2(month + 1)}`, start: new Date(year, month, 1) };
}

function groupByNone(date: Date): TimelineGroupKey {
  return { key: 'all', start: date };
}

function resolveGrouper<T>(mode: TimelineGroupBy<T>): TimelineGroupingFn<T> {
  if (typeof mode === 'function') {
    return mode;
  }
  switch (mode) {
    case 'week':
      return groupByWeek;
    case 'month':
      return groupByMonth;
    case 'none':
      return groupByNone;
    default:
      return groupByDay;
  }
}

function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

function sameItems<T>(previous: readonly T[], next: readonly T[]): boolean {
  return previous.length === next.length && previous.every((item, i) => item === next[i]);
}

function groupsEqual<T>(a: readonly TimelineGroup<T>[], b: readonly TimelineGroup<T>[]): boolean {
  return a.length === b.length && a.every((group, index) => group === b[index]);
}

/**
 * Derives grouped, sorted timeline bands from a flat item list.
 *
 * Pure derivation: bands come out of one `linkedSignal` over the `items`
 * accessor. Nothing is synced, nothing is written back, and the presenter
 * never mutates its input array. The previous bands are read through the
 * `computation` callback rather than a closure cache, so the result depends
 * on the inputs and the prior value alone - never on how many times it ran.
 *
 * Three properties make it usable as the organism's only data path:
 *
 * - **Defensive sort.** Consumer data does not have to arrive sorted. The
 *   presenter sorts by the accessor date on every run using a stable sort,
 *   so items sharing a timestamp keep their input order in both
 *   directions.
 * - **Local-calendar bucketing.** `day` / `week` / `month` read local date
 *   fields rather than dividing the epoch, which is what keeps 23-hour and
 *   25-hour DST days intact. Consumers who want UTC (or any other rule)
 *   pass a {@link TimelineGroupingFn}.
 * - **Append-stability.** Groups whose items are *the same objects* hand
 *   back the same band reference, and the signal carries a structural
 *   `equal`. Reuse is deliberately keyed on reference identity rather than
 *   on an id: a refetch returns new objects at the same ids, and reusing
 *   there would pin the band to a stale payload. Appending therefore leaves
 *   every other band's
 *   `@for` block untouched instead of re-rendering the whole timeline.
 *
 * Reach for the DI token {@link CNGX_TIMELINE_GROUPING_FACTORY} rather
 * than this function directly when the caller is a component - that is
 * what makes the bucketing swappable per app or per component.
 *
 * ```ts
 * const grouping = createTimelineGrouping({
 *   items: this.events,
 *   dateAccessor: (event) => event.occurredAt,
 *   groupBy: this.groupBy,
 * });
 * ```
 *
 * @category common/timeline
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/timeline/grouping.ts
 * @since 0.1.0
 */
export function createTimelineGrouping<T>(
  options: TimelineGroupingOptions<T>,
): TimelineGrouping<T> {
  const { items, dateAccessor, groupBy, direction } = options;

  // `linkedSignal` rather than `computed`: append-stability needs the
  // previous bands to hand their references back, and this is the sanctioned
  // way to read them. A closure cache mutated inside a `computed` would make
  // the computation impure - its output would depend on how many times it had
  // run, not only on its inputs.
  const groups = linkedSignal<readonly TimelineGroup<T>[], readonly TimelineGroup<T>[]>({
    source: () => {
      const source = items();
      const grouper = resolveGrouper(groupBy?.() ?? 'day');
      const sign = (direction?.() ?? 'desc') === 'asc' ? 1 : -1;

      const dated = source.map((item) => ({ item, date: toDate(dateAccessor(item)) }));
      dated.sort((a, b) => sign * (a.date.getTime() - b.date.getTime()));

      // Map preserves insertion order, so buckets come out already sorted.
      const buckets = new Map<string, Bucket<T>>();
      for (const entry of dated) {
        const { key, start } = grouper(entry.date, entry.item);
        const bucket = buckets.get(key);
        if (bucket) {
          bucket.items.push(entry.item);
        } else {
          buckets.set(key, { start, items: [entry.item] });
        }
      }

      return Array.from(buckets, ([key, bucket]) => ({
        key,
        start: bucket.start,
        items: bucket.items as readonly T[],
      }));
    },
    computation: (fresh, previous) => {
      const previousByKey = new Map((previous?.value ?? []).map((group) => [group.key, group]));
      return fresh.map((group) => {
        const prior = previousByKey.get(group.key);
        // Reference identity only. Matching ids are NOT enough: a refetch
        // returns fresh objects at the same ids with changed content, and
        // handing back the prior band there would render the old payload
        // forever. Reference equality is the only signal that says "these
        // are literally the same items", which is what reuse requires.
        const reusable =
          prior?.start.getTime() === group.start.getTime() &&
          sameItems(prior.items, group.items);
        return reusable ? prior : group;
      });
    },
    equal: groupsEqual,
  });

  return { groups };
}

/**
 * Signature of {@link createTimelineGrouping}, carried as a named type so
 * a DI override matches it exactly.
 *
 * @category common/timeline
 */
export type CngxTimelineGroupingFactory = <T>(
  options: TimelineGroupingOptions<T>,
) => TimelineGrouping<T>;

/**
 * Resolves the presenter `<cngx-timeline>` builds its bands with.
 * Defaults to {@link createTimelineGrouping}.
 *
 * Override app-wide via
 * `providers: [{ provide: CNGX_TIMELINE_GROUPING_FACTORY, useValue: myFactory }]`
 * to change bucketing everywhere (fiscal calendars, "today / earlier"
 * relative bands, server-supplied grouping), or per component via
 * `viewProviders` for a one-off. An override wraps rather than replaces
 * in most cases - call `createTimelineGrouping` inside your factory and
 * post-process its `groups`.
 *
 * Same shape as `CNGX_SELECTION_CONTROLLER_FACTORY`: the internals of a
 * component are swappable without forking the component.
 *
 * @category common/timeline
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/timeline/grouping.ts
 * @relatedTo createTimelineGrouping
 * @since 0.1.0
 */
export const CNGX_TIMELINE_GROUPING_FACTORY = new InjectionToken<CngxTimelineGroupingFactory>(
  'CngxTimelineGroupingFactory',
  {
    providedIn: 'root',
    factory: () => createTimelineGrouping,
  },
);
