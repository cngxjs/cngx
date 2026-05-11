import { InjectionToken, type Provider } from '@angular/core';

/**
 * Application environment descriptor.
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
 */
export const ENVIRONMENT = new InjectionToken<Environment>('NGX_CAE_ENVIRONMENT');

/** Provides an `Environment` value for the `ENVIRONMENT` token. */
export function provideEnvironment(env: Environment): Provider {
  return { provide: ENVIRONMENT, useValue: env };
}
