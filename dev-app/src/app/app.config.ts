import { type ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideTreetable, withHighlightOnHover } from '@cngx/data-display/treetable';
import { provideFeedback, withToasts, withAlerts, withBanners } from '@cngx/ui/feedback';
import { provideFormField, withErrorMessages, withConstraintHints, withRequiredMarker } from '@cngx/forms/field';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withFetch()),
    provideRouter(routes, withHashLocation()),
    provideTreetable(withHighlightOnHover()),
    provideFeedback(withToasts(), withAlerts(), withBanners()),
    provideFormField(
      withErrorMessages({
        required: () => 'This field is required.',
        email: () => 'Invalid email address.',
        minLength: (e) => `Minimum ${(e as unknown as { minLength: number }).minLength} characters.`,
        maxLength: (e) => `Maximum ${(e as unknown as { maxLength: number }).maxLength} characters.`,
      }),
      withConstraintHints(),
      withRequiredMarker(),
    ),
  ],
};
