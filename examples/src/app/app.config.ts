import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, TitleStrategy, withHashLocation } from '@angular/router';
import { provideContrast, provideMotion, provideTextScale } from '@cngx/core';
import { provideDialog } from '@cngx/common/dialog';
import {
  provideFormField,
  withErrorMessages,
  withRequiredMarker,
} from '@cngx/forms/field';
import {
  provideFeedback,
  withAlerts,
  withBanners,
  withToasts,
} from '@cngx/ui/feedback';

import { routes } from './app.routes';
import { CngxExamplesTitleStrategy } from './cngx-examples-title-strategy';

// Seed the text scale from the floating toggle's persisted preference
// (localStorage 'cngx_text_size', written by main.ts) so the initial paint
// matches the last choice with no md->persisted flash. 'md' is the identity
// base; the key is only present for 'sm' / 'lg'.
function initialTextScale(): 'sm' | 'md' | 'lg' {
  try {
    const v = localStorage.getItem('cngx_text_size');
    if (v === 'sm' || v === 'lg') {
      return v;
    }
  } catch {
    // localStorage may be unavailable; fall back to the md base.
  }
  return 'md';
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Install the text-scale reflector at app root so the text-scale demo's
    // injectTextScale().set(...) reflects onto <html data-text-size> and
    // re-scales the whole rem type ramp globally. Seeded from the persisted
    // toggle preference so a reload keeps the chosen size.
    provideTextScale(initialTextScale()),
    // Install the motion reflector at app root so the motion demo's
    // injectMotion().set(...) reflects onto <html data-motion> and drives the
    // reduced-motion safety net globally. Default 'auto' removes the attribute
    // so the OS prefers-reduced-motion preference stays in charge until a user
    // opts into an explicit override.
    provideMotion(),
    // Install the contrast reflector at app root so the contrast demo's
    // injectContrast().set(...) reflects onto <html data-contrast> and drives
    // the higher-contrast token overrides globally. Default 'auto' removes the
    // attribute so the OS prefers-contrast preference stays in charge until a
    // user opts into an explicit override.
    provideContrast(),
    // Hash routing - GitHub Pages serves a single index.html and cannot rewrite
    // deep paths to it. With withHashLocation() every route resolves client-side
    // off the `#` fragment, no 404 fallback trick required.
    provideRouter(
      [
        // Local Material-bridge fidelity harness (hand-authored; survives the
        // generated app.routes.ts overwrite). Not part of the demo catalogue.
        {
          path: 'material-lab',
          loadComponent: () => import('./material-lab/material-lab').then((m) => m.MaterialLab),
          // The harness renders cngx-form-field with required markers and
          // field-level error messages; both need an app-scoped config the
          // examples app does not otherwise provide.
          providers: [
            provideFormField(
              withRequiredMarker(),
              withErrorMessages({
                required: () => 'This field is required',
                email: () => 'Enter a valid email address',
              }),
            ),
          ],
        },
        ...routes,
      ],
      withHashLocation(),
    ),
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
