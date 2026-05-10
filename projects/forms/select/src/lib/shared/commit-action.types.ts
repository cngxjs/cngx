import type { Observable } from 'rxjs';

/**
 * Async write handler invoked on a pick when `[commitAction]` is bound.
 * Receives the intended value (`undefined` on clear). Resolves to the
 * committed value — typically the intended value, or a server-normalised
 * variant.
 *
 * @category interactive
 */
export type CngxSelectCommitAction<T> = (intended: T | undefined) =>
  | Observable<T | undefined>
  | Promise<T | undefined>
  | T
  | undefined;

/**
 * Panel UX during an in-flight commit. Consecutive picks supersede.
 *
 * - `'optimistic'` (default) — panel closes, trigger shows intended value,
 *   rolls back on error.
 * - `'pessimistic'` — panel stays open, option-row spinner, trigger
 *   disabled. Closes on success; stays open on error with inline UI.
 *
 * @category interactive
 */
export type CngxSelectCommitMode = 'optimistic' | 'pessimistic';

/**
 * Default error UI when no `*cngxSelectCommitError` slot is projected.
 *
 * - `'banner'` (default) — top-of-panel banner.
 * - `'inline'` — indicator next to the offending option row.
 * - `'none'` — no built-in UI; bridge via `CngxToastOn` etc.
 *
 * @category interactive
 */
export type CngxSelectCommitErrorDisplay = 'inline' | 'banner' | 'none';
