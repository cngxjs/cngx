import type { Observable } from 'rxjs';

/**
 * Async write handler for the action-slot `commit()` callback. Receives the
 * live `searchTerm` plus the drafted `{ label }`. Always resolves to a
 * definite `T` - a successful create yields a materialised value.
 *
 * @category forms/select
 */
export type CngxSelectCreateAction<T> = (
  searchTerm: string,
  draft: { readonly label: string },
) => Observable<T> | Promise<T> | T;
