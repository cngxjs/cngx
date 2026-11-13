import { inject, InjectionToken, type Provider, type Type } from '@angular/core';

/**
 * The caret glyph component of every `cngxMenuButton` without a projected `cngxButtonEnd`, and of
 * every split caret. Without it the caret is `CNGX_ICON_CHEVRON_DOWN`. It renders inside an
 * `aria-hidden` `<cngx-icon>`, so it draws a glyph and nothing else.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/caret-icon.token.ts
 * @since 0.1.0
 * @relatedTo provideButtonCaretIcon, injectButtonCaretIcon, CngxMenuButton, CngxIconMenuButton, withButtonCaretIcon
 * <example-url>/#/common/menu-button/menu-button/custom-caret</example-url>
 */
export const CNGX_BUTTON_CARET_ICON = new InjectionToken<Type<unknown>>('CngxButtonCaretIcon');

/**
 * Provides the caret below the provider, in `providers` or `viewProviders`. The nearest provider
 * wins.
 *
 * ```ts
 * bootstrapApplication(App, { providers: [provideButtonCaretIcon(MaterialCaret)] });
 * ```
 *
 * @param component The glyph component; it renders inside the `aria-hidden` caret `<cngx-icon>`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/caret-icon.token.ts
 * @since 0.1.0
 * @relatedTo CNGX_BUTTON_CARET_ICON, injectButtonCaretIcon, withButtonCaretIcon
 * <example-url>/#/common/menu-button/menu-button/custom-caret</example-url>
 */
export function provideButtonCaretIcon(component: Type<unknown>): Provider {
  return { provide: CNGX_BUTTON_CARET_ICON, useValue: component };
}

/**
 * The caret set with `provideButtonCaretIcon`, or `null` for the default chevron.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/caret-icon.token.ts
 * @since 0.1.0
 * @relatedTo CNGX_BUTTON_CARET_ICON, provideButtonCaretIcon
 */
export function injectButtonCaretIcon(): Type<unknown> | null {
  return inject(CNGX_BUTTON_CARET_ICON, { optional: true });
}
