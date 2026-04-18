import type { Observable } from 'rxjs';

/**
 * Async write handler invoked when a user picks a value with
 * `[commitAction]` bound. Called with the newly-intended value (or
 * `undefined` for a clear). Returns a `Promise`, `Observable`, or sync
 * value resolving to the committed value — typically equal to the
 * intended value, or a server-normalised variant.
 *
 * @category interactive
 */
export type CngxSelectCommitAction<T> = (intended: T | undefined) =>
  | Observable<T | undefined>
  | Promise<T | undefined>
  | T
  | undefined;

/**
 * Commit mode controls the panel UX around the in-flight write.
 *
 * - `'optimistic'` (default): panel closes immediately, trigger shows
 *   the intended value. On error, value rolls back to the previous
 *   committed value.
 * - `'pessimistic'`: panel stays open, selected option shows a spinner
 *   indicator, trigger is disabled while pending. On success, panel
 *   closes. On error, panel stays open and surfaces the error inline.
 *
 * In both modes, consecutive picks supersede any in-flight commit.
 *
 * @category interactive
 */
export type CngxSelectCommitMode = 'optimistic' | 'pessimistic';

/**
 * Where a `commitAction` error is rendered when no `*cngxSelectCommitError`
 * template is projected.
 *
 * - `'banner'` (default): a top-of-panel banner above the options.
 * - `'inline'`: small error indicator next to the offending option row.
 * - `'none'`: no built-in UI; consumers typically bridge via `CngxToastOn` et al.
 *
 * @category interactive
 */
export type CngxSelectCommitErrorDisplay = 'inline' | 'banner' | 'none';
