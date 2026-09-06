import { linkedSignal, type Signal } from '@angular/core';

/**
 * Options for {@link createAnnouncementPhrase}.
 *
 * @category core/utils/async-state
 * @since 0.1.0
 */
export interface AnnouncementPhraseOptions<TSource> {
  /** Reactive snapshot the phrase derives from. */
  readonly source: () => TSource;
  /**
   * Returns the phrase for a voiced transition between two snapshots, or
   * `null` when this change carries nothing to announce. An empty string
   * is a valid phrase (it arms "silence") - only `null` falls through to
   * the `spend` check.
   */
  readonly arm: (current: TSource, previous: TSource) => string | null;
  /**
   * `true` when a transition must expire (spend) an armed phrase - e.g.
   * a busy-state start whose later clear would otherwise re-announce the
   * stale phrase through an `aria-atomic` region. Checked only when
   * `arm` returned `null`.
   */
  readonly spend?: (current: TSource, previous: TSource) => boolean;
  /**
   * Phrase at mount, before any transition. Defaults to the empty string
   * so initial state is visible, never announced.
   */
  readonly seed?: (source: TSource) => string;
}

/**
 * Declarative live-region phrase with transition arming and expiry - the
 * shared shape behind "voice the change, not the standing state". A real
 * transition (`arm`) sets the phrase; an expiry transition (`spend`)
 * clears an already-voiced phrase so a later content change cannot
 * re-announce it; everything else keeps the previous phrase.
 *
 * Fully derived (`linkedSignal` over source snapshots) - no `effect`, no
 * imperative previous-value tracking.
 *
 * **Eager-read caveat.** `linkedSignal` only observes source snapshots it
 * is actually read under. A consumer that renders this phrase behind a
 * short-circuiting arm (`busy() ? busyPhrase : phrase()`) MUST read the
 * phrase eagerly before branching, otherwise the phrase never observes
 * the busy-start snapshot and the `spend` transition is skipped.
 *
 * ```ts
 * private readonly selectionPhrase = createAnnouncementPhrase({
 *   source: () => ({ selected: this.selected(), loading: this.loading() }),
 *   arm: (curr, prev) =>
 *     curr.selected !== prev.selected ? (curr.selected ? 'Selected' : 'Deselected') : null,
 *   spend: (curr, prev) => curr.loading && !prev.loading,
 * });
 * ```
 *
 * @category core/utils/async-state
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/announcement-phrase.ts
 * @since 0.1.0
 * @relatedTo createTransitionTracker, ValueTransition
 */
export function createAnnouncementPhrase<TSource>(
  options: AnnouncementPhraseOptions<TSource>,
): Signal<string> {
  const { source, arm, spend, seed } = options;
  return linkedSignal<TSource, string>({
    source,
    computation: (src, prev) => {
      if (prev === undefined) {
        return seed ? seed(src) : '';
      }
      const armed = arm(src, prev.source);
      if (armed !== null) {
        return armed;
      }
      if (spend?.(src, prev.source)) {
        return '';
      }
      return prev.value;
    },
    equal: Object.is,
  }).asReadonly();
}
