import { InjectionToken, type Signal } from '@angular/core';

/**
 * State every cngx button type publishes about itself, so a composing
 * molecule reads it without importing a concrete button class.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-state.token.ts
 * @since 0.1.0
 * @relatedTo CNGX_BUTTON_STATE, CngxButtonBrain
 */
export interface CngxButtonState {
  /**
   * `true` while the button refuses activation: disabled, running a
   * co-hosted `cngxAsyncClick`, or refused by its `[enabled]="false"`.
   */
  readonly blocked: Signal<boolean>;
  /**
   * `true` while the button runs: a co-hosted `cngxAsyncClick` is pending or
   * the host reflects a run of its own. The immediate truth, without the
   * busy layer's show delay.
   */
  readonly busy: Signal<boolean>;
  /**
   * Id of the element that says why the button is disabled, while it
   * describes the button (`disabled` with a reason), else `null`. A
   * composing molecule references it to explain its own refusal.
   */
  readonly activeReasonId: Signal<string | null>;
}

/**
 * DI token every cngx button provides on its own host through
 * `CngxButtonBrain`: `cngxButton`, `cngxIconButton`, `cngxCloseButton`,
 * `cngxMenuButton`, `cngxIconMenuButton` and `cngx-action-button`. A split
 * button reads its main action through it.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-state.token.ts
 * @since 0.1.0
 * @relatedTo CngxButton, CngxIconButton, CngxSplitButton
 */
export const CNGX_BUTTON_STATE = new InjectionToken<CngxButtonState>('CngxButtonState');
