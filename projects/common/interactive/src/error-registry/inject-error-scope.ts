import { DestroyRef, inject, signal } from '@angular/core';
import type { CngxErrorScopeContract } from '../error-scope/error-scope.token';
import { CngxErrorRegistry } from './error-registry';

/**
 * Creates a programmatic {@link CngxErrorScopeContract}, optionally
 * registered under `name` in the ambient {@link CngxErrorRegistry}.
 *
 * Use when an error scope must exist without a DOM host — e.g. inside a
 * route guard, an HTTP interceptor, or a service that drives error
 * visibility programmatically. When `name` is set and a registry is
 * provided in the host environment, the scope auto-registers and
 * auto-deregisters on the surrounding `DestroyRef`.
 *
 * Must be called in an injection context (constructor, factory provider,
 * `runInInjectionContext`).
 *
 * @internal Staged API — single-consumer.
 * See form-primitives-accepted-debt.md §A for the re-evaluation trigger
 * and collapse plan.
 *
 * @category functions
 */
export function injectErrorScope(name?: string): CngxErrorScopeContract {
  const showErrorsState = signal(false);
  const scopeName = signal<string | undefined>(name);

  const contract: CngxErrorScopeContract = {
    showErrors: showErrorsState.asReadonly(),
    scopeName: scopeName.asReadonly(),
    reveal: () => showErrorsState.set(true),
    reset: () => showErrorsState.set(false),
  };

  if (name) {
    const registry = inject(CngxErrorRegistry, { optional: true });
    if (registry) {
      const destroyRef = inject(DestroyRef);
      registry.registerScope(name, contract);
      destroyRef.onDestroy(() => registry.unregisterScope(name));
    }
  }

  return contract;
}
