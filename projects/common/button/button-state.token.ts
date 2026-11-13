import { InjectionToken, type Signal } from '@angular/core';

/**
 * Button state a composing molecule reads without importing a button class.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-state.token.ts
 * @since 0.1.0
 * @relatedTo CNGX_BUTTON_STATE, CngxButtonBrain
 */
export interface CngxButtonState {
  /**
   * Refuses activation: `disabled`, a host refusal, a run or its held busy layer, or a refusing
   * runner (`cngxAsyncClick` with `[enabled]="false"`).
   */
  readonly blocked: Signal<boolean>;
  /** A co-hosted run is pending or the host reflects one. Ungated. */
  readonly busy: Signal<boolean>;
  /** Disabled-reason id while it applies, else `null`. Reference it to explain a refusal. */
  readonly activeReasonId: Signal<string | null>;
}

/**
 * Provided by every host on `CngxButtonBrain`. A split button reads its main action through it.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-state.token.ts
 * @since 0.1.0
 * @relatedTo CngxButton, CngxIconButton, CngxSplitButton, CngxButtonBrain, CngxSplitCaret, CngxActionButton
 */
export const CNGX_BUTTON_STATE = new InjectionToken<CngxButtonState>('CngxButtonState');
