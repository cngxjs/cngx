import { type ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { provideFeedback, withToasts } from '@cngx/ui/feedback';

import { backendInterceptor } from './backend';

// Re-exported by the entry components so compodocx ships app.config.ts in the
// StackBlitz manifest - the seam for EnvironmentProviders that a static
// `<example-url>` story cannot set up: HttpClient + the fake-backend
// interceptor, plus the feedback root so `cngxToastOn` can fire a toast.
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([backendInterceptor])),
    provideFeedback(withToasts()),
  ],
};
