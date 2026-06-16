import { type ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { backendInterceptor } from './backend';

// Re-exported by the entry components so compodocx ships app.config.ts in the
// StackBlitz manifest - the seam for EnvironmentProviders (here: HttpClient +
// the fake-backend interceptor) that a static `<example-url>` story cannot set up.
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([backendInterceptor])),
  ],
};
