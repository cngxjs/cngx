import { InjectionToken, type Signal } from '@angular/core';
import type { CngxButtonState } from '@cngx/common/button';

/**
 * What a `cngxSplitButton` tells its caret. `CngxSplitCaret` reads it, and a custom caret host
 * can read it for more than the directive supplies.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/split-button.token.ts
 * @since 0.1.0
 * @relatedTo CngxSplitButton, CngxSplitCaret, CngxIconMenuButton, CNGX_SPLIT_BUTTON, CNGX_BUTTON_STATE
 */
export interface CngxSplitButtonContext {
  /** `true` while the main button refuses activation. The caret is blocked with it. */
  readonly mainBlocked: Signal<boolean>;
  /**
   * `true` while the main button runs, from a co-hosted run or one its host reflects (an action
   * button's `[externalState]`). The caret is described as busy with it.
   */
  readonly mainBusy: Signal<boolean>;
  /** Id of the main button's reason while it is disabled with one, else `null`. */
  readonly mainReasonId: Signal<string | null>;
  /** The button state of the caret, the direct child that carries `CngxSplitCaret`. */
  readonly caret: Signal<CngxButtonState | undefined>;
}

/**
 * Provided by `CngxSplitButton`. `CngxSplitCaret` injects it to take the main action's blocked
 * state and its description.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/split-button.token.ts
 * @since 0.1.0
 * @relatedTo CngxSplitButton, CngxSplitCaret, CngxIconMenuButton, CngxSplitButtonContext, CNGX_BUTTON_STATE
 */
export const CNGX_SPLIT_BUTTON = new InjectionToken<CngxSplitButtonContext>('CngxSplitButton');
