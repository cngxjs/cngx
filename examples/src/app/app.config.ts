import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, TitleStrategy, withHashLocation } from '@angular/router';
import { provideDialog } from '@cngx/common/dialog';
import {
  provideFeedback,
  withAlerts,
  withBanners,
  withToasts,
} from '@cngx/ui/feedback';

import { routes } from './app.routes';
import { CngxExamplesTitleStrategy } from './cngx-examples-title-strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Hash routing - GitHub Pages serves a single index.html and cannot rewrite
    // deep paths to it. With withHashLocation() every route resolves client-side
    // off the `#` fragment, no 404 fallback trick required.
    provideRouter(routes, withHashLocation()),
    // CngxAlerter / CngxBanner / CngxToaster are not providedIn: 'root';
    // root-level access requires opting in via with*() feature functions.
    provideFeedback(withAlerts(), withBanners(), withToasts()),
    // CngxDialogOpener for imperative `dialog.open(Component)` usage.
    // Demo-only: stories that teach the programmatic path inject the opener
    // from this root provider so they do not need their own ApplicationConfig.
    provideDialog(),
    // Read the deepest matched route's `data.title` and set the document
    // title so direct-loaded story URLs surface the right page name.
    { provide: TitleStrategy, useClass: CngxExamplesTitleStrategy },
  ],
};
