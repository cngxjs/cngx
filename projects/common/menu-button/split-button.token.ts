import { InjectionToken, type Signal } from '@angular/core';

/**
 * What a `cngxSplitButton` tells the icon menu button inside it.
 *
 * @since 0.1.0
 * @relatedTo CngxSplitButton, CngxIconMenuButton
 */
export interface CngxSplitButtonContext {
  /**
   * `true` while the main `cngxButton` refuses activation (disabled, running
   * its `cngxAsyncClick`, or refused by `[enabled]="false"`). The caret is
   * blocked with it.
   */
  readonly mainBlocked: Signal<boolean>;
}

/**
 * Provided by `CngxSplitButton`; an icon menu button inside reads it to
 * inherit the main action's blocked state, render the caret and take its
 * default name from the language pack.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/split-button.token.ts
 * @since 0.1.0
 * @relatedTo CngxSplitButton, CngxIconMenuButton
 */
export const CNGX_SPLIT_BUTTON = new InjectionToken<CngxSplitButtonContext>('CngxSplitButton');
