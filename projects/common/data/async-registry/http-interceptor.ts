import { type EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import {
  HttpEventType,
  type HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { finalize, tap } from 'rxjs';
import { createManualState } from '../async-state/create-manual-state';
import { CngxAsyncRegistry } from './async-registry';
import { CNGX_ASYNC_LABEL, CNGX_ASYNC_SKIP } from './http-context';

/**
 * Functional HTTP interceptor that surfaces every in-flight `HttpRequest` in
 * the ambient {@link CngxAsyncRegistry}, so `isAnythingLoading()` aggregates
 * raw HTTP traffic alongside explicit component states.
 *
 * Fully opt-in and self-contained:
 * - Resolves `inject(CngxAsyncRegistry, { optional: true })` and passes the
 *   request straight through when no registry is provided - zero behaviour
 *   change for consumers who do not opt in.
 * - Passes through without registering when `CNGX_ASYNC_SKIP` is set.
 * - Otherwise registers a fresh `createManualState` (set `loading`) under a
 *   per-request uid, maps the final response / error onto it, and
 *   `unregister`s in a `finalize` that fires on success **and** error (and on
 *   unsubscribe), so a request can never pin the global loading state.
 *
 * Per-request uid identity (from `CngxAsyncRegistry`) means concurrent requests
 * sharing a label never evict one another - completing one leaves the other
 * tracked. The interceptor does not swallow errors: `setError` records the
 * failure, then the error propagates to the caller unchanged.
 *
 * @category common/data/async-registry
 */
export const cngxAsyncInterceptor: HttpInterceptorFn = (req, next) => {
  const registry = inject(CngxAsyncRegistry, { optional: true });
  if (!registry || req.context.get(CNGX_ASYNC_SKIP)) {
    return next(req);
  }

  const state = createManualState<unknown>();
  state.set('loading');
  const operationId = registry.register(state, req.context.get(CNGX_ASYNC_LABEL));

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event.type === HttpEventType.Response) {
          state.setSuccess(event.body);
        }
      },
      error: (err: unknown) => state.setError(err),
    }),
    finalize(() => registry.unregister(operationId)),
  );
};

/**
 * Sets up `HttpClient` with {@link cngxAsyncInterceptor} so every request
 * surfaces in {@link CngxAsyncRegistry}. Opt-in - add it to
 * `bootstrapApplication` providers alongside `provideAsyncRegistry()`.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideAsyncRegistry(),
 *     provideAsyncHttpObservability(),
 *   ],
 * });
 * ```
 *
 * **Use this only when cngx owns the `HttpClient` setup.** It calls
 * `provideHttpClient(withInterceptors([cngxAsyncInterceptor]))` internally, so
 * an app that already calls `provideHttpClient` (especially with `withFetch()`
 * or other features) would get a second, feature-less `HttpClient`
 * configuration - last-provider-wins on `HttpBackend` can silently revert
 * `withFetch()` to the XHR backend. In that case do not call this; add the
 * exported {@link cngxAsyncInterceptor} to your own `withInterceptors` instead:
 *
 * ```ts
 * provideHttpClient(withFetch(), withInterceptors([authInterceptor, cngxAsyncInterceptor]))
 * ```
 *
 * @category common/data/async-registry
 */
export function provideAsyncHttpObservability(): EnvironmentProviders {
  return makeEnvironmentProviders([provideHttpClient(withInterceptors([cngxAsyncInterceptor]))]);
}
