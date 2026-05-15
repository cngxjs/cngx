import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideFeedback,
  withAlerts,
  withBanners,
  withToasts,
} from '@cngx/ui/feedback';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    // CngxAlerter / CngxBanner / CngxToaster are not providedIn: 'root';
    // root-level access requires opting in via with*() feature functions.
    provideFeedback(withAlerts(), withBanners(), withToasts()),
  ],
};
