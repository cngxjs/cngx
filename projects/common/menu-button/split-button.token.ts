import { InjectionToken, type Signal } from '@angular/core';
import type { CngxButtonState } from '@cngx/common/button';

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
  /**
   * `true` while the main button runs (its `cngxAsyncClick` is pending). The
   * caret is described as busy with it.
   */
  readonly mainBusy: Signal<boolean>;
  /**
   * Id of the main button's reason while it is disabled with one, else
   * `null`. The caret references it, so its refusal carries the cause.
   */
  readonly mainReasonId: Signal<string | null>;
  /**
   * The button state of the split's caret: the direct child
   * `cngxIconMenuButton`. An icon menu button deeper inside the split (in a
   * projected panel, say) is not the caret and keeps its own state and name.
   */
  readonly caret: Signal<CngxButtonState | undefined>;
}

/**
 * Provided by `CngxSplitButton`; an icon menu button inside reads it to
 * inherit the main action's blocked state and its description (the main's
 * reason, the busy note), render the caret and take its default name from
 * the language pack.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/split-button.token.ts
 * @since 0.1.0
 * @relatedTo CngxSplitButton, CngxIconMenuButton
 */
export const CNGX_SPLIT_BUTTON = new InjectionToken<CngxSplitButtonContext>('CngxSplitButton');
