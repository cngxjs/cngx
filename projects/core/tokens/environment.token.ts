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
 * Provide via `provideEnvironment()` in `bootstrapApplication`.
 *
 * @category core/tokens
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/tokens/environment.token.ts
 * @since 0.1.0
 */
export const ENVIRONMENT = new InjectionToken<Environment>('NGX_CAE_ENVIRONMENT');

/**
 * Provides an `Environment` value for the `ENVIRONMENT` token.
 *
 * @category core/tokens
 */
export function provideEnvironment(env: Environment): Provider {
  return { provide: ENVIRONMENT, useValue: env };
}
