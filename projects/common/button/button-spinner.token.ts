import { inject, InjectionToken, type Provider, type Type } from '@angular/core';

/**
 * Custom busy glyph in place of the built-in spinner. Only the glyph changes: the `aria-hidden`
 * layer and its show delay and min-dwell stay.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-spinner.token.ts
 * @since 0.1.0
 * @relatedTo provideButtonSpinner, injectButtonSpinner, CngxButtonBrain, CngxButton, withButtonSpinner
 * <example-url>/#/common/button/button/custom-spinner</example-url>
 */
export const CNGX_BUTTON_SPINNER = new InjectionToken<Type<unknown>>('CngxButtonSpinner');

/**
 * Busy glyph for every cngx button below. `providers` or `viewProviders`; the nearest wins.
 *
 * ```ts
 * bootstrapApplication(App, { providers: [provideButtonSpinner(MyDotsSpinner)] });
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-spinner.token.ts
 * @since 0.1.0
 * @relatedTo CNGX_BUTTON_SPINNER, injectButtonSpinner
 * <example-url>/#/common/button/button/custom-spinner</example-url>
 */
export function provideButtonSpinner(component: Type<unknown>): Provider {
  return { provide: CNGX_BUTTON_SPINNER, useValue: component };
}

/**
 * The {@link provideButtonSpinner} glyph, or `null` for the built-in spinner.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-spinner.token.ts
 * @since 0.1.0
 * @relatedTo CNGX_BUTTON_SPINNER, provideButtonSpinner
 */
export function injectButtonSpinner(): Type<unknown> | null {
  return inject(CNGX_BUTTON_SPINNER, { optional: true });
}
