import { isObservable, type Observable, of } from 'rxjs';

/**
 * Ensures the value is an observable.
 *
 * @category utils/rxjs-interop
 */
export function ensureObservable<T>(value: T | Observable<T>): Observable<T> {
  return isObservable(value) ? value : of(value);
}
