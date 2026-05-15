import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
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
    // Hash routing — GitHub Pages serves a single index.html and cannot rewrite
    // deep paths to it. With withHashLocation() every route resolves client-side
    // off the `#` fragment, no 404 fallback trick required.
    provideRouter(routes, withHashLocation()),
    // CngxAlerter / CngxBanner / CngxToaster are not providedIn: 'root';
    // root-level access requires opting in via with*() feature functions.
    provideFeedback(withAlerts(), withBanners(), withToasts()),
  ],
};
