import { InjectionToken, type Provider } from '@angular/core';

export interface Environment {
  production: boolean;
  [key: string]: unknown;
}

export const ENVIRONMENT = new InjectionToken<Environment>('NGX_CAE_ENVIRONMENT');

/** Provides an `Environment` value for the `ENVIRONMENT` token. */
export function provideEnvironment(env: Environment): Provider {
  return { provide: ENVIRONMENT, useValue: env };
}
