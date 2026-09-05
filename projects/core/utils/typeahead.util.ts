/**
 * Case-insensitive prefix match between an item label and a typeahead
 * query term - THE matching semantic of every cngx typeahead surface.
 *
 * `CngxActiveDescendant` applies it to the rendered window on every
 * buffered keystroke; `CngxTreeSelect`'s expand-to-reveal miss search
 * applies it to the full flat tree. Both MUST agree on what "matches"
 * means - a revealed node that the rendered-window walk would then
 * skip (or vice versa) breaks the type-to-find contract. Change the
 * semantic here (e.g. locale folding, `includes` fallback) and every
 * consumer moves together.
 *
 * Both sides are lowercased, so pre-lowercased buffer terms and raw
 * user input behave identically. An empty term matches every label
 * (`startsWith('')` is `true`) - callers gate on a non-empty buffer.
 *
 * ```typescript
 * matchesTypeahead('Postgres', 'p');   // true
 * matchesTypeahead('Postgres', 'PO');  // true
 * matchesTypeahead('Postgres', 'g');   // false - prefix, not substring
 * ```
 *
 * @category core/utils/typeahead
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/typeahead.util.ts
 * @since 0.1.0
 * @relatedTo CngxActiveDescendant, CngxTreeSelect
 */
export function matchesTypeahead(label: string, term: string): boolean {
  return label.toLowerCase().startsWith(term.toLowerCase());
}
