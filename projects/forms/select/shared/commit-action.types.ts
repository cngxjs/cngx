import type { Observable } from 'rxjs';

/**
 * Async write handler invoked on a pick when `[commitAction]` is bound.
 * Receives the intended value (`undefined` on clear). Resolves to the
 * committed value - typically the intended value, or a server-normalised
 * variant.
 *
 * An Observable settles on its first emission; later emissions are ignored.
 * An Observable that completes without emitting (`EMPTY`, a `filter` that
 * drops every value) settles the commit as a `CngxRuntimeError` with code
 * [`CNGX2025`](/error-codes/cngx2025.md), so the panel never stays blocked on a commit
 * that cannot finish. Emit `undefined` before completing when the server
 * has nothing to return. A source that neither emits nor completes stays
 * pending until a newer commit supersedes it.
 */
export type CngxSelectCommitAction<T> = (
  intended: T | undefined,
) => Observable<T | undefined> | Promise<T | undefined> | T | undefined;

/**
 * Panel UX during an in-flight commit. Consecutive picks supersede.
 *
 * - `'optimistic'` (default) - panel closes, trigger shows intended value,
 *   rolls back on error.
 * - `'pessimistic'` - panel stays open, option-row spinner, trigger
 *   disabled. Closes on success; stays open on error with inline UI.
 *
 * In `'optimistic'` mode a bound form field mirrors the model, so it holds
 * the intended value while the commit is in flight and rolls back with the
 * model on error. Pick `'pessimistic'` when the field must only ever hold a
 * server-confirmed value.
 */
export type CngxSelectCommitMode = 'optimistic' | 'pessimistic';

/**
 * Default error UI when no `*cngxSelectCommitError` slot is projected.
 *
 * - `'banner'` (default) - top-of-panel banner.
 * - `'inline'` - indicator next to the offending option row.
 * - `'none'` - no built-in UI; bridge via `CngxToastOn` etc.
 */
export type CngxSelectCommitErrorDisplay = 'inline' | 'banner' | 'none';
