import { DestroyRef, inject, signal } from '@angular/core';
import type { CngxErrorScopeContract } from '../error-scope/error-scope.token';
import { CngxErrorRegistry } from './error-registry';

/**
 * Creates a programmatic {@link CngxErrorScopeContract}, optionally
 * registered under `name` in the ambient {@link CngxErrorRegistry}.
 *
 * Use when an error scope must exist without a DOM host - e.g. inside a
 * route guard, an HTTP interceptor, or a service that drives error
 * visibility programmatically. When `name` is set and a registry is
 * provided in the host environment, the scope auto-registers and
 * auto-deregisters on the surrounding `DestroyRef`.
 *
 * Must be called in an injection context (constructor, factory provider,
 * `runInInjectionContext`).
 *
 * @category common/interactive/error
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/error-registry/inject-error-scope.ts
 * @since 0.1.0
 * @relatedTo CngxErrorScope
 * <example-url>http://localhost:4200/#/common/interactive/error/registry/inject-error-scope-programmatic</example-url>
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
      destroyRef.onDestroy(() => registry.unregisterScope(name, contract));
    }
  }

  return contract;
}
