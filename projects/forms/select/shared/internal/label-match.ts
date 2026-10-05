import type { Signal } from '@angular/core';

import { foldForMatching } from '@cngx/core/utils';

interface Folded {
  readonly locale: string;
  readonly source: string;
  readonly folded: string;
}

/**
 * Accent- and case-tolerant substring match of an option label against a
 * search term, in the locale the signal holds: the shared fold of
 * `@cngx/core/utils` on both sides. The term is folded once per term and
 * locale; a label passed with its option object as `key` is folded once per
 * label text and locale (cache per item), a label without one on every call.
 * An empty term matches every label. Reads `locale` where it is called, so a
 * filter `computed()` re-runs on a locale switch.
 *
 * @internal
 */
export function createLabelMatch(
  locale: Signal<string>,
): (label: string, term: string, key?: object) => boolean {
  const labels = new WeakMap<object, Folded>();
  let lastTerm: Folded | undefined;
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
