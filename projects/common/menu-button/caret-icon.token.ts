import { InjectionToken, type Type } from '@angular/core';

/**
 * Injection token for a custom caret component, rendered by every
 * `button[cngxMenuButton]` whose `cngxButtonEnd` slot is empty. Provide it
 * at the root or on a subtree to swap the default chevron app-wide, e.g. a
 * wrapper around a Material `arrow_drop_down` icon. The caret sits inside an
 * `aria-hidden` `<cngx-icon>`, so the component renders a glyph only.
 *
 * ```ts
 * providers: [{ provide: CNGX_BUTTON_CARET_ICON, useValue: MyCaretIcon }]
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/caret-icon.token.ts
 * @since 0.1.0
 * @relatedTo CngxMenuButton
 * <example-url>http://localhost:4200/#/common/menu-button/menu-button/custom-caret</example-url>
 */
export const CNGX_BUTTON_CARET_ICON = new InjectionToken<Type<unknown>>('CngxButtonCaretIcon');
