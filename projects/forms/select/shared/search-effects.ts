import {
  InjectionToken,
  computed,
  effect,
  inject,
  untracked,
  type Signal,
  type WritableSignal,
} from '@angular/core';

import type { AsyncView } from '@cngx/common/data';

import { CngxSelectAnnouncer } from './announcer';
import type { CngxSelectAriaLabels } from './config';
import { resolveSelectConfig } from './internal/resolve-config';

/**
 * The filter outcome {@link createSearchEffects} speaks once a typed term
 * settles.
 */
export interface SearchEffectsResults {
  /** Options matching the settled term. */
  readonly count: Signal<number>;
  /**
   * `true` while `count` reflects the term: the options are loaded and no
   * refresh is in flight. Nothing is spoken until it is `true`.
   */
  readonly settled: Signal<boolean>;
  /** The resolved copy keys; read untracked, so a language switch never re-speaks. */
  readonly ariaLabels: Signal<
    Required<Pick<CngxSelectAriaLabels, 'announceResults' | 'announceNoResults'>>
  >;
}

/**
 * Config for {@link createSearchEffects}.
 */
export interface SearchEffectsOptions {
  /** Debounced search-term signal. */
  readonly searchTerm: Signal<string>;
  readonly panelOpen: Signal<boolean>;
  readonly disabled: Signal<boolean>;
  /**
   * `true` while the field is readonly. A readonly host accepts no write, so
   * a settled term never auto-opens its panel. Omitted defaults to never
   * readonly.
   */
  readonly readonly?: Signal<boolean>;
  /** Typically `() => this.popoverRef()?.show()`. */
  readonly open: () => void;
  /**
   * Extra auto-open gate. Display-binding variants pass
   * `() => !this.display.isWritingFromValue()` so library writes
   * don't re-open a panel the user just closed.
   */
  readonly autoOpenGate?: () => boolean;
  /**
   * Focus of the input that owns the term. When given, auto-open needs it:
   * a term whose debounce settles after the input lost focus never reopens
   * the panel.
   */
  readonly focused?: Signal<boolean>;
  /**
   * Term the user dismissed with Escape or blur while its debounce was still
   * pending. A settling term equal to this marker never auto-opens, so an
   * Escape inside the debounce window keeps the panel shut. Typing a new term
   * clears it. Omitted means nothing is ever treated as dismissed.
   */
  readonly dismissedTerm?: Signal<string | null>;
  /**
   * Optional `searchTermChange` forward. Display-binding variants
   * route through `onUserSearchTerm` and leave this undefined.
   */
  readonly emit?: {
    readonly hasEmittedInitial: WritableSignal<boolean>;
    readonly skipInitial: Signal<boolean>;
    readonly onEmit: (term: string) => void;
  };
  /**
   * Speaks the filter outcome politely through the `CngxSelectAnnouncer` in
   * scope: the number of matches, or that none matched. Silent for an empty
   * term, while the panel is closed and until the results settle; a term and
   * count pair is spoken once.
   */
  readonly results?: SearchEffectsResults;
}

/**
 * Up to three `effect()`s for input-trigger variants: `skipInitial`-gated
 * `searchTermChange` forward (when `emit` is set), auto-open-on-typing, and
 * the filter-outcome announcement (when `results` is set). External calls
 * wrapped in `untracked`. Injection context required.
 */
export function createSearchEffects(opts: SearchEffectsOptions): void {
  if (opts.emit) {
    const e = opts.emit;
    effect(() => {
      const term = opts.searchTerm();
      untracked(() => {
        const initial = !e.hasEmittedInitial();
        e.hasEmittedInitial.set(true);
        if (initial && e.skipInitial()) {
          return;
        }
        e.onEmit(term);
      });
    });
  }

  const autoOpenGate = opts.autoOpenGate ?? ((): boolean => true);

  effect(() => {
    const term = opts.searchTerm();
    untracked(() => {
      if (
        term !== '' &&
        term !== (opts.dismissedTerm?.() ?? null) &&
        !opts.panelOpen() &&
        !opts.disabled() &&
        !(opts.readonly?.() ?? false) &&
        (opts.focused?.() ?? true) &&
        autoOpenGate()
      ) {
        opts.open();
      }
    });
  });

  if (opts.results) {
    announceSearchResults(opts, opts.results);
  }
}

/**
 * @internal The `results` option of a variant: the count of its filtered
 * options, settled once the panel shows content or the empty state with no
 * refresh in flight.
 */
export function searchResultsFrom(source: {
  readonly count: () => number;
  readonly activeView: Signal<AsyncView>;
  readonly refreshing: Signal<boolean>;
  readonly ariaLabels: SearchEffectsResults['ariaLabels'];
}): SearchEffectsResults {
  return {
    count: computed(() => source.count()),
    settled: computed(() => {
      const view = source.activeView();
      return (view === 'content' || view === 'empty') && !source.refreshing();
    }),
    ariaLabels: source.ariaLabels,
  };
}

/** @internal The filter-outcome announcement of {@link createSearchEffects}. */
function announceSearchResults(opts: SearchEffectsOptions, results: SearchEffectsResults): void {
  const announcer = inject(CngxSelectAnnouncer);
  const config = resolveSelectConfig();
  let spokenKey: string | null = null;
  effect(() => {
    const term = opts.searchTerm();
    const count = results.count();
    const ready = results.settled() && opts.panelOpen();
    if (term === '') {
      spokenKey = null;
      return;
    }
    const key = `${count}\u0000${term}`;
    if (!ready || key === spokenKey) {
      return;
    }
    spokenKey = key;
    untracked(() => {
      const announcerConfig = config.announcer();
      if (announcerConfig.enabled === false) {
        return;
      }
      const copy = results.ariaLabels();
      announcer.announce(
        count === 0 ? copy.announceNoResults : copy.announceResults(count),
        announcerConfig.politeness ?? 'polite',
      );
    });
  });
}

/**
 * Factory signature for {@link CNGX_SEARCH_EFFECTS_FACTORY}.
 */
export type CngxSearchEffectsFactory = (opts: SearchEffectsOptions) => void;

/**
 * Factory for the search effects that wire a debounced search term to panel
 * auto-open and the `searchTermChange` forward. Default `createSearchEffects`.
 * Override to change the auto-open gating or term-forwarding for filter variants.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/search-effects.ts
 * @since 0.1.0
 * @relatedTo CngxCombobox, CngxTypeahead, withTypeaheadDebounce
 */
export const CNGX_SEARCH_EFFECTS_FACTORY =
  new InjectionToken<CngxSearchEffectsFactory>('CngxSearchEffectsFactory', {
    providedIn: 'root',
    factory: () => createSearchEffects,
  });
