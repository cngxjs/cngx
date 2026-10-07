import type { Signal } from '@angular/core';

// Combining marks, plus format characters such as the U+2068 / U+2069 isolates
// formatMessage wraps around inserted text.
const FOLDED_AWAY = /[\p{M}\p{Cf}]/gu;

/**
 * Folds text for case- and accent-tolerant matching: lowercases with
 * `locale` (plain `toLowerCase()` without one), then NFD-normalises and drops
 * combining marks and invisible format characters (bidi isolates, zero-width
 * joiners). The order matters - the other way round decomposes Turkish
 * `İ` to `I` + dot and lowercases that `I` to dotless `ı`. Fold both sides of
 * a comparison with the same locale.
 *
 * ```typescript
 * foldForMatching('Über');            // 'uber'
 * foldForMatching('İzmir', 'tr');     // 'izmir'
 * ```
 *
 * @category core/utils/typeahead
 * @since 0.1.0
 * @relatedTo matchesTypeahead
 */
export function foldForMatching(value: string, locale?: string): string {
  const lower = locale ? value.toLocaleLowerCase(locale) : value.toLowerCase();
  return lower.normalize('NFD').replace(FOLDED_AWAY, '');
}

/**
 * Accent- and case-tolerant prefix match between an item label and a
 * typeahead query term - THE matching semantic of every cngx typeahead
 * surface.
 *
 * `CngxActiveDescendant` applies it to the rendered window on every
 * buffered keystroke; `CngxTreeSelect`'s expand-to-reveal miss search
 * applies it to the full flat tree. Both MUST agree on what "matches"
 * means - a revealed node that the rendered-window walk would then
 * skip (or vice versa) breaks the type-to-find contract. Change the
 * semantic here and every consumer moves together.
 *
 * Both sides are lowercased with `locale` (plain `toLowerCase()` without
 * one), NFD-normalised and stripped of combining marks, so `u` finds
 * `Über`, `e` finds `Éclair` and, under `'tr'`, `i` finds `İzmir`. Marks
 * are stripped on both sides, so a term never misses a label it would
 * find without them. An empty term matches every label
 * (`startsWith('')` is `true`) - callers gate on a non-empty buffer.
 *
 * ```typescript
 * matchesTypeahead('Postgres', 'PO');      // true
 * matchesTypeahead('Postgres', 'g');       // false - prefix, not substring
 * matchesTypeahead('Über', 'u');           // true
 * matchesTypeahead('İzmir', 'i', 'tr');    // true
 * ```
 *
 * @category core/utils/typeahead
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/typeahead.util.ts
 * @since 0.1.0
 * @relatedTo CngxActiveDescendant, CngxTreeSelect
 */
export function matchesTypeahead(label: string, term: string, locale?: string): boolean {
  return createTypeaheadMatcher(term, locale)(label);
}

interface FoldedLabel {
  readonly label: string;
  readonly locale: string | undefined;
  readonly folded: string;
}

/** Folded labels per option object; the label and locale are compared on every read. */
const FOLDED_LABELS = new WeakMap<object, FoldedLabel>();

function foldedLabelOf(label: string, locale: string | undefined, key: object | undefined): string {
  if (!key) {
    return foldForMatching(label, locale);
  }
  const cached = FOLDED_LABELS.get(key);
  if (cached?.label === label && cached.locale === locale) {
    return cached.folded;
  }
  const folded = foldForMatching(label, locale);
  FOLDED_LABELS.set(key, { label, locale, folded });
  return folded;
}

/**
 * {@link matchesTypeahead} for a walk over many labels: the term is folded
 * once, and a label passed with its option object as `key` is folded once per
 * label text and locale, so a keystroke over a long list folds only what
 * changed. Same semantic as {@link matchesTypeahead}.
 *
 * ```typescript
 * const matches = createTypeaheadMatcher(term, locale);
 * const hit = options.find((option) => matches(option.label, option));
 * ```
 *
 * @category core/utils/typeahead
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/typeahead.util.ts
 * @since 0.1.0
 * @relatedTo matchesTypeahead, foldForMatching
 */
export function createTypeaheadMatcher(
  term: string,
  locale?: string,
): (label: string, key?: object) => boolean {
  const folded = foldForMatching(term, locale);
  return (label, key) => foldedLabelOf(label, locale, key).startsWith(folded);
}

interface FoldedText {
  readonly locale: string;
  readonly source: string;
  readonly folded: string;
}

/**
 * Accent- and case-tolerant SUBSTRING match of a label against a search term
 * in the locale `locale` holds - the filter semantic of every cngx search box
 * (listbox search, select-family search inputs). Both sides go through
 * {@link foldForMatching}. Prefix matching for type-to-find stays with
 * {@link createTypeaheadMatcher}.
 *
 * The returned function folds the term once per term and locale (it keeps
 * the last one) and a label passed with its item object as `key` once per
 * label text and locale; the label cache is a `WeakMap` owned by this matcher
 * instance, so it never outlives the items. A label without `key` is folded on
 * every call. An empty term matches every label. `locale` is read on every
 * call, so a filter `computed()` that calls the matcher re-runs on a locale
 * switch.
 *
 * ```typescript
 * const matches = createLabelMatcher(injectLocale());
 * const visible = computed(() =>
 *   options().filter((option) => matches(option.label, term(), option)),
 * );
 * ```
 *
 * @category core/utils
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/typeahead.util.ts
 * @since 0.1.0
 * @relatedTo createTypeaheadMatcher, foldForMatching
 */
export function createLabelMatcher(
  locale: Signal<string>,
): (label: string, term: string, key?: object) => boolean {
  const labels = new WeakMap<object, FoldedText>();
  let lastTerm: FoldedText | undefined;
  const foldedLabel = (label: string, current: string, key: object | undefined): string => {
    if (!key) {
      return foldForMatching(label, current);
    }
    const hit = labels.get(key);
    if (hit?.locale === current && hit.source === label) {
      return hit.folded;
    }
    const entry = { locale: current, source: label, folded: foldForMatching(label, current) };
    labels.set(key, entry);
    return entry.folded;
  };
  const foldedTerm = (term: string, current: string): string => {
    if (lastTerm?.locale !== current || lastTerm.source !== term) {
      lastTerm = { locale: current, source: term, folded: foldForMatching(term, current) };
    }
    return lastTerm.folded;
  };
  return (label, term, key) => {
    if (term === '') {
      return true;
    }
    const current = locale();
    return foldedLabel(label, current, key).includes(foldedTerm(term, current));
  };
}
