import { type EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { CngxAsyncRegistry } from './async-registry';

/**
 * Provides {@link CngxAsyncRegistry} in the host environment.
 *
 * Opt-in - not `providedIn: 'root'`. Add it to `bootstrapApplication`
 * providers to enable app-wide async observability; producers that opt in
 * (`injectAsyncState({ register: true })`, `provideCngxHttpObservability()`)
 * then surface in `isAnythingLoading()` / `activeOperations()`.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideAsyncRegistry()],
 * });
 * ```
 *
 * @category common/data/async-registry
 */
export function provideAsyncRegistry(): EnvironmentProviders {
  return makeEnvironmentProviders([CngxAsyncRegistry]);
}

/**
 * Returns the ambient {@link CngxAsyncRegistry}, or `null` when the consumer
 * did not opt in via {@link provideAsyncRegistry}. Must run in an injection
 * context.
 *
 * @category common/data/async-registry
 */
export function injectAsyncRegistry(): CngxAsyncRegistry | null {
  return inject(CngxAsyncRegistry, { optional: true });
}
