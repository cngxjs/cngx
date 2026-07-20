/**
 * Structural equality for the `key -> earcon` maps the directive binding
 * computeds return. Both `[cngxAudio]` and `[cngxAudioStatus]` derive a fresh
 * `Map` from their spec string on every recompute; without an `equal` fn the
 * `computed` would hand a new reference to any reactive consumer even when the
 * parsed bindings are identical (the signal-hygiene Equality Rule). Same size,
 * same value per key.
 *
 * @internal — not exported from `public-api.ts`.
 */
export function sameStringMap<K>(a: ReadonlyMap<K, string>, b: ReadonlyMap<K, string>): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (const [key, value] of a) {
    if (b.get(key) !== value) {
      return false;
    }
  }
  return true;
}
