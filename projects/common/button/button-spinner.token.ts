import { inject, InjectionToken, type Provider, type Type } from '@angular/core';

/**
 * Injection token for a custom busy glyph, rendered inside the busy layer of
 * every cngx button (`cngxButton`, `cngxIconButton`, `cngxCloseButton`,
 * `cngxMenuButton`, `cngxIconMenuButton`, `cngxActionButton` and custom hosts
 * on `CngxButtonBrain`) in place of the built-in spinner. The layer itself
 * stays: it covers the label (width stable), is `aria-hidden`, and follows
 * the show delay and min-dwell of the run, so the component renders a glyph
 * only. Set it with {@link provideButtonSpinner} at the root or on a subtree.
 *
 * ```ts
 * providers: [provideButtonSpinner(MyDotsSpinner)]
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-spinner.token.ts
 * @since 0.1.0
 * @relatedTo provideButtonSpinner, injectButtonSpinner, CngxButtonBrain, CngxButton
 * <example-url>/#/common/button/button/custom-spinner</example-url>
 */
export const CNGX_BUTTON_SPINNER = new InjectionToken<Type<unknown>>('CngxButtonSpinner');

/**
 * Provides `component` as the busy glyph of every cngx button below the
 * provider (`CNGX_BUTTON_SPINNER`). Works in `providers` and
 * `viewProviders`; the nearest provider wins.
 *
 * ```ts
 * bootstrapApplication(App, { providers: [provideButtonSpinner(MyDotsSpinner)] });
 * ```
 *
 * @param component The glyph component; it renders inside the `aria-hidden` busy layer.
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
 * Reads the busy glyph provided through {@link provideButtonSpinner}, or
 * `null` when none is set and the built-in spinner renders. Runs in an
 * injection context; `CngxButtonBrain` reads it once for its host as
 * `spinner`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-spinner.token.ts
 * @since 0.1.0
 * @relatedTo CNGX_BUTTON_SPINNER, provideButtonSpinner
 */
export function injectButtonSpinner(): Type<unknown> | null {
  return inject(CNGX_BUTTON_SPINNER, { optional: true });
}
