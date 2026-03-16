import { isObservable, type Observable, of } from 'rxjs';

/**
 * Ensures the value is an observable.
 */
export function ensureObservable<T>(value: T | Observable<T>): Observable<T> {
  if (isObservable(value)) {
    return value;
  }
  return of(value);
}
