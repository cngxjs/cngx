const COMBINING_MARKS = /\p{M}/gu;

/**
 * @internal Lowercases with the locale first, then drops combining marks:
 * the other order would decompose Turkish `İ` to `I` + dot and lowercase
 * that `I` to dotless `ı`.
 */
function foldForTypeahead(value: string, locale: string | undefined): string {
  const lower = locale ? value.toLocaleLowerCase(locale) : value.toLowerCase();
  return lower.normalize('NFD').replace(COMBINING_MARKS, '');
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
  return foldForTypeahead(label, locale).startsWith(foldForTypeahead(term, locale));
}
