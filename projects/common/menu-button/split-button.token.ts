import { InjectionToken, type Signal } from '@angular/core';
import type { CngxButtonState } from '@cngx/common/button';

/**
 * What a `cngxSplitButton` tells its caret. A custom caret host can read it for more than
 * `CngxSplitCaret` supplies.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/split-button.token.ts
 * @since 0.1.0
 * @relatedTo CngxSplitButton, CngxSplitCaret, CngxIconMenuButton, CNGX_SPLIT_BUTTON, CNGX_BUTTON_STATE
 */
export interface CngxSplitButtonContext {
  /** `true` while the main button refuses activation. */
  readonly mainBlocked: Signal<boolean>;
  /** `true` while the main button runs, including a run its host reflects (`[externalState]`). */
  readonly mainBusy: Signal<boolean>;
  /** Id of the main button's reason while it is disabled with one, else `null`. */
  readonly mainReasonId: Signal<string | null>;
  /** The caret's button state. */
  readonly caret: Signal<CngxButtonState | undefined>;
}

/**
 * Provided by `CngxSplitButton`, injected by `CngxSplitCaret`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/split-button.token.ts
 * @since 0.1.0
 * @relatedTo CngxSplitButton, CngxSplitCaret, CngxIconMenuButton, CngxSplitButtonContext, CNGX_BUTTON_STATE
 */
export const CNGX_SPLIT_BUTTON = new InjectionToken<CngxSplitButtonContext>('CngxSplitButton');
