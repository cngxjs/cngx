import {
  DestroyRef,
  type EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  type Provider,
} from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { CngxErrorRegistry } from './error-registry';

/**
 * @internal Staged API — single-consumer.
 * See form-primitives-accepted-debt.md §A for the re-evaluation trigger
 * and collapse plan.
 */
export interface _ErrorRegistryConfig {
  revealOnSubmit?: boolean;
  revealOnNavigate?: boolean;
}

/**
 * @internal Staged API — single-consumer.
 * See form-primitives-accepted-debt.md §A for the re-evaluation trigger
 * and collapse plan.
 */
export interface ErrorRegistryFeature {
  /** @internal */
  readonly _apply: (config: _ErrorRegistryConfig) => _ErrorRegistryConfig;
}

/**
 * Provides {@link CngxErrorRegistry} and optional global reveal triggers.
 *
 * Composes feature flags via `_apply` partial-config functions, mirroring
 * `provideFormField`'s shape. Without features, registers the registry only;
 * pair with {@link withGlobalRevealOnSubmit} or {@link withRevealOnNavigate}
 * to install ambient reveal behaviour.
 *
 * @example
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideErrorRegistry(
 *       withGlobalRevealOnSubmit(),
 *       withRevealOnNavigate(),
 *     ),
 *   ],
 * });
 * ```
 *
 * @internal Staged API — single-consumer.
 * See form-primitives-accepted-debt.md §A for the re-evaluation trigger
 * and collapse plan.
 *
 * @category configuration
 */
export function provideErrorRegistry(
  ...features: ErrorRegistryFeature[]
): EnvironmentProviders {
  let config: _ErrorRegistryConfig = {};
  for (const f of features) {
    config = f._apply(config);
  }

  const providers: (Provider | EnvironmentProviders)[] = [CngxErrorRegistry];

  if (config.revealOnSubmit) {
    providers.push(
      provideEnvironmentInitializer(() => {
        if (typeof document === 'undefined') {
          return;
        }
        const registry = inject(CngxErrorRegistry);
        const destroyRef = inject(DestroyRef);
        const handler = (): void => registry.revealAll();
        document.addEventListener('submit', handler, true);
        destroyRef.onDestroy(() => {
          document.removeEventListener('submit', handler, true);
        });
      }),
    );
  }

  if (config.revealOnNavigate) {
    providers.push(
      provideEnvironmentInitializer(() => {
        const router = inject(Router, { optional: true });
        if (!router) {
          return;
        }
        const registry = inject(CngxErrorRegistry);
        const destroyRef = inject(DestroyRef);
        const subscription = router.events
          .pipe(filter((event): event is NavigationStart => event instanceof NavigationStart))
          .subscribe(() => registry.revealAll());
        destroyRef.onDestroy(() => subscription.unsubscribe());
      }),
    );
  }

  return makeEnvironmentProviders(providers);
}

/**
 * Reveals every registered scope on any DOM `submit` event.
 *
 * **Coarse-grained — affects every registered scope, every form.** The
 * feature installs a capture-phase document listener that calls
 * `registry.revealAll()` on any submit anywhere in the document, even
 * when the submit fires from a form unrelated to the scope of interest.
 * Appropriate when the application treats every submit as a "show all
 * errors now" trigger.
 *
 * For finer-grained reveals (per-form, per-flow), skip this feature and
 * call `registry.reveal(name)` from the consumer's submit handler
 * instead — the scope-name registration path stays available without
 * the global listener.
 *
 * @internal Staged API — single-consumer.
 * See form-primitives-accepted-debt.md §A for the re-evaluation trigger
 * and collapse plan.
 *
 * @category configuration
 */
export function withGlobalRevealOnSubmit(): ErrorRegistryFeature {
  return { _apply: (c) => ({ ...c, revealOnSubmit: true }) };
}

/**
 * Reveals every registered scope on `Router.NavigationStart`.
 *
 * Requires `provideRouter()` (or equivalent) in the host environment.
 * No-op when no `Router` is provided so the feature degrades gracefully
 * in test harnesses or non-routed apps.
 *
 * **Fires before route guards.** `NavigationStart` emits before
 * `CanActivate` / `CanDeactivate` guards run, so a navigation that gets
 * cancelled by a guard still leaves every scope revealed. Acceptable for
 * the common pattern (reveal-all on attempted navigation) but surface
 * the implication when wiring a guard that cancels based on form errors.
 *
 * @internal Staged API — single-consumer.
 * See form-primitives-accepted-debt.md §A for the re-evaluation trigger
 * and collapse plan.
 *
 * @category configuration
 */
export function withRevealOnNavigate(): ErrorRegistryFeature {
  return { _apply: (c) => ({ ...c, revealOnNavigate: true }) };
}
