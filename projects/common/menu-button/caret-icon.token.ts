import { inject, InjectionToken, type Provider, type Type } from '@angular/core';

/**
 * The caret glyph component of every `cngxMenuButton` without a projected `cngxButtonEnd`, and of
 * every split caret. Without it the caret is `CNGX_ICON_CHEVRON_DOWN`.
 *
 * Set it with `provideButtonCaretIcon`, for example to a wrapper around a Material
 * `arrow_drop_down` icon. The component renders inside an `aria-hidden` `<cngx-icon>`, so it draws
 * a glyph and nothing else.
 *
 * ```ts
 * providers: [provideButtonCaretIcon(MyCaretIcon)]
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/caret-icon.token.ts
 * @since 0.1.0
 * @relatedTo provideButtonCaretIcon, injectButtonCaretIcon, CngxMenuButton, CngxIconMenuButton, withButtonCaretIcon
 * <example-url>/#/common/menu-button/menu-button/custom-caret</example-url>
 */
export const CNGX_BUTTON_CARET_ICON = new InjectionToken<Type<unknown>>('CngxButtonCaretIcon');

/**
 * Provides `component` as the caret of every menu button and split caret below the provider.
 * Works in `providers` and `viewProviders`, and the nearest provider wins.
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
 * Reads the caret component set with `provideButtonCaretIcon`, or `null` for the default
 * chevron. A custom menu button host calls it in an injection context.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/caret-icon.token.ts
 * @since 0.1.0
 * @relatedTo CNGX_BUTTON_CARET_ICON, provideButtonCaretIcon
 */
export function injectButtonCaretIcon(): Type<unknown> | null {
  return inject(CNGX_BUTTON_CARET_ICON, { optional: true });
}
