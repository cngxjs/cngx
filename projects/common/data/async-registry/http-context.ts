import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * Per-request label surfaced in `CngxAsyncRegistry.activeOperations` when the
 * request is tracked by `cngxAsyncInterceptor`. Display only, never a key.
 *
 * @category common/data/async-registry
 */
export const CNGX_ASYNC_LABEL = new HttpContextToken<string | undefined>(() => undefined);

/**
 * Per-request opt-out. When `true`, `cngxAsyncInterceptor` passes the request
 * through without registering it - keeps polling / telemetry pings out of the
 * aggregate without a global allow-list.
 *
 * @category common/data/async-registry
 */
export const CNGX_ASYNC_SKIP = new HttpContextToken<boolean>(() => false);

/**
 * Returns an `HttpContext` that labels the request for async observability.
 * Pass an existing context to chain with other tokens.
 *
 * ```typescript
 * this.http.get('/api/users', { context: withAsyncLabel('users') });
 * ```
 *
 * @category common/data/async-registry
 */
export function withAsyncLabel(label: string, context: HttpContext = new HttpContext()): HttpContext {
  return context.set(CNGX_ASYNC_LABEL, label);
}

/**
 * Returns an `HttpContext` that opts the request out of async observability.
 * Pass an existing context to chain with other tokens.
 *
 * ```typescript
 * this.http.get('/api/ping', { context: withAsyncSkip() });
 * ```
 *
 * @category common/data/async-registry
 */
export function withAsyncSkip(context: HttpContext = new HttpContext()): HttpContext {
  return context.set(CNGX_ASYNC_SKIP, true);
}
