/** @internal */
let counter = 0;

/**
 * Generates a unique ID string with the given prefix.
 *
 * Each call returns a monotonically increasing ID: `prefix-0`, `prefix-1`, etc.
 * Used internally for ARIA `id` attributes on dialogs, popovers, and tooltips.
 *
 * The counter is module-level and per JS realm, so IDs are **not stable
 * across an SSR render and its client hydration** - the server and the
 * browser each count from 0 in their own creation order, and the ids can
 * diverge. The impact is bounded because every cngx consumer re-binds the
 * generated id through signals after hydration, but do not persist a
 * `nextUid` value or use it as a cross-request key.
 *
 * @category core/utils
 * @since 0.1.0
 */
export function nextUid(prefix: string): string {
  return `${prefix}-${counter++}`;
}
