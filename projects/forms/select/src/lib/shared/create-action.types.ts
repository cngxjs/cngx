import type { Observable } from 'rxjs';

/**
 * Signature of the async write handler invoked by
 * {@link /projects/forms/select/src/lib/action-select/action-select.component.ts
 * CngxActionSelect} (and its multi-value sibling) when the consumer
 * fires the action slot's `commit()` callback. The handler receives
 * the live `searchTerm` plus the drafted `{ label }` carried through
 * the slot context.
 *
 * The return type mirrors {@link CngxSelectCommitAction} but resolves
 * to a definite `T` (not `T | undefined`): a create operation that
 * succeeds produces a newly-materialised value.
 *
 * @category interactive
 */
export type CngxSelectCreateAction<T> = (
  searchTerm: string,
  draft: { readonly label: string },
) => Observable<T> | Promise<T> | T;
