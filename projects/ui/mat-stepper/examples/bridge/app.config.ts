import { type ApplicationConfig, provideZoneChangeDetection } from '@angular/core';

import { provideFeedback, withBanners, withToasts } from '@cngx/ui/feedback';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideFeedback(withToasts(), withBanners()),
  ],
};
