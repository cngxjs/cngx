/**
 * Pure-TS ordinal scale. Maps a discrete categorical domain to a
 * cycling palette of values (typically colours). When the domain is
 * longer than the palette, mappings wrap modulo palette length.
 *
 * @param domain Ordered list of categorical values. Values are matched
 *   by reference equality on lookup.
 * @param colors Palette to cycle through. Must have at least one entry;
 *   an empty palette throws synchronously at construction time.
 * @returns Callable `(v: T) => string` returning the palette entry for
 *   `v`. Lookup of an unknown value returns the palette's first entry.
 */
export function createOrdinalScale<T>(
  domain: readonly T[],
  colors: readonly string[],
): (v: T) => string {
  if (colors.length === 0) {
    throw new Error('createOrdinalScale: colors palette must not be empty');
  }
  const lookup = new Map<T, string>();
  for (let i = 0; i < domain.length; i++) {
    lookup.set(domain[i], colors[i % colors.length]);
  }
  return (v: T) => lookup.get(v) ?? colors[0];
}
