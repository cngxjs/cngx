import { inject, InjectionToken, type Provider, type Type } from '@angular/core';

/**
 * Injection token for a custom caret component, rendered by every
 * `button[cngxMenuButton]` whose `cngxButtonEnd` slot is empty and by the
 * caret of every `cngxSplitButton`. Without it the caret is
 * `CNGX_ICON_CHEVRON_DOWN` from the shared icon set. Set it with
 * {@link provideButtonCaretIcon} at the root or on a subtree to swap the
 * glyph app-wide, e.g. a wrapper around a Material `arrow_drop_down` icon.
 * The caret sits inside an `aria-hidden` `<cngx-icon>`, so the component
 * renders a glyph only.
 *
 * ```ts
 * providers: [provideButtonCaretIcon(MyCaretIcon)]
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/caret-icon.token.ts
 * @since 0.1.0
 * @relatedTo provideButtonCaretIcon, injectButtonCaretIcon, CngxMenuButton, CngxIconMenuButton
 * <example-url>/#/common/menu-button/menu-button/custom-caret</example-url>
 */
export const CNGX_BUTTON_CARET_ICON = new InjectionToken<Type<unknown>>('CngxButtonCaretIcon');

/**
 * Provides `component` as the caret of every menu button and split caret
 * below the provider (`CNGX_BUTTON_CARET_ICON`). Works in `providers` and
 * `viewProviders`; the nearest provider wins.
 *
 * ```ts
 * bootstrapApplication(App, { providers: [provideButtonCaretIcon(MaterialCaret)] });
 * ```
 *
 * @param component The glyph component; it renders inside the `aria-hidden` caret `<cngx-icon>`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/caret-icon.token.ts
 * @since 0.1.0
 * @relatedTo CNGX_BUTTON_CARET_ICON, injectButtonCaretIcon
 * <example-url>/#/common/menu-button/menu-button/custom-caret</example-url>
 */
export function provideButtonCaretIcon(component: Type<unknown>): Provider {
  return { provide: CNGX_BUTTON_CARET_ICON, useValue: component };
}

/**
 * Reads the caret component provided through {@link provideButtonCaretIcon},
 * or `null` when none is set and the default chevron renders. Runs in an
 * injection context; a custom menu host reads its caret through it.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/caret-icon.token.ts
 * @since 0.1.0
 * @relatedTo CNGX_BUTTON_CARET_ICON, provideButtonCaretIcon
 */
export function injectButtonCaretIcon(): Type<unknown> | null {
  return inject(CNGX_BUTTON_CARET_ICON, { optional: true });
}
