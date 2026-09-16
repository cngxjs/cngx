import { InjectionToken, type Provider } from '@angular/core';

/**
 * Application environment descriptor.
 *
 * @category core/tokens
 */
export interface Environment {
  /** Whether the application is running in production mode. */
  production: boolean;
  [key: string]: unknown;
}

/**
 * Injection token for the application environment configuration.
 *
 * A consumer-app utility: it gives application code (and app-level cngx
 * wiring such as feature flags in providers) a typed DI handle on the
 * `environment.ts` object instead of a direct module import, so the value
 * can be swapped per bootstrap and stubbed in tests. No cngx library code
 * reads it.
 *
 * The token has **no default factory**. `inject(ENVIRONMENT)` without a
 * `provideEnvironment()` in the bootstrap providers throws a
 * `NullInjectorError` - deliberately, because a silently-empty environment
 * would turn missing wiring into wrong runtime behavior. Code that must
 * work without one reads it as `inject(ENVIRONMENT, { optional: true })`
 * and handles the `null`.
 *
 * @category core/tokens
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/tokens/environment.token.ts
 * @since 0.1.0
 * @relatedTo provideEnvironment
 */
export const ENVIRONMENT = new InjectionToken<Environment>('CNGX_ENVIRONMENT');

/**
 * Provides an `Environment` value for the `ENVIRONMENT` token.
 *
 * ```typescript
 * import { environment } from './environments/environment';
 *
 * bootstrapApplication(AppComponent, {
 *   providers: [provideEnvironment(environment)],
 * });
 * ```
 *
 * @category core/tokens
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/tokens/environment.token.ts
 * @since 0.1.0
 * @relatedTo ENVIRONMENT
 */
export function provideEnvironment(env: Environment): Provider {
  return { provide: ENVIRONMENT, useValue: env };
}
