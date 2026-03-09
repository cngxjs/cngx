import { InjectionToken } from '@angular/core';

export interface Environment {
  production: boolean;
  [key: string]: unknown;
}

export const ENVIRONMENT = new InjectionToken<Environment>('NGX_CAE_ENVIRONMENT');
