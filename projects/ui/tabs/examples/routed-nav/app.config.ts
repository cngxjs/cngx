import { type ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';

import { ROUTES } from './demo-routes';

// Re-exported by the entry component so compodocx ships app.config.ts in
// the StackBlitz manifest - the only seam for EnvironmentProviders
// (here: the router) in the playground. `withHashLocation` keeps deep
// links working inside the WebContainer preview frame.
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(ROUTES, withHashLocation()),
  ],
};
