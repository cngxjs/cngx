import { InjectionToken, type Signal } from '@angular/core';
import type { CngxButtonState } from '@cngx/common/button';

/**
 * What a `cngxSplitButton` tells the caret inside it (`CngxSplitCaret`, the
 * caret role `cngxIconMenuButton` renders on).
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/split-button.token.ts
 * @since 0.1.0
 * @relatedTo CngxSplitButton, CngxSplitCaret, CngxIconMenuButton
 */
export interface CngxSplitButtonContext {
  /**
   * `true` while the main button refuses activation (its `CNGX_BUTTON_STATE`
   * `blocked`: disabled, running, refused by a co-hosted runner or by its
   * host). The main is any cngx button that is not the caret. The caret is
   * blocked with it.
   */
  readonly mainBlocked: Signal<boolean>;
  /**
   * `true` while the main button runs (its `CNGX_BUTTON_STATE` `busy`: a
   * co-hosted run is pending or its host reflects one, as an action button
   * does for `[externalState]`). The caret is described as busy with it.
   */
  readonly mainBusy: Signal<boolean>;
  /**
   * Id of the main button's reason while it is disabled with one, else
   * `null`. The caret references it, so its refusal carries the cause.
   */
  readonly mainReasonId: Signal<string | null>;
  /**
   * The button state of the split's caret: the direct child host of
   * `CngxSplitCaret` (`cngxIconMenuButton` or a custom host). A caret host
   * deeper inside the split (in a projected panel, say) is not the caret and
   * keeps its own state and name.
   */
  readonly caret: Signal<CngxButtonState | undefined>;
}

/**
 * Provided by `CngxSplitButton`; `CngxSplitCaret` on the caret reads it to
 * inherit the main action's blocked state and its description (the main's
 * reason, the busy note), and its host renders the caret and takes its
 * default name from the language pack.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/split-button.token.ts
 * @since 0.1.0
 * @relatedTo CngxSplitButton, CngxSplitCaret, CngxIconMenuButton
 */
export const CNGX_SPLIT_BUTTON = new InjectionToken<CngxSplitButtonContext>('CngxSplitButton');
