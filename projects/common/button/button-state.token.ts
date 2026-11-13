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
   * `true` while the button refuses activation:
   *
   * - `disabled` is set
   * - the host refuses through `CNGX_BUTTON_HOST_STATE`
   * - a run is in flight, or its busy layer is held through the dwell
   * - a co-hosted runner refuses, e.g. `cngxAsyncClick` with `[enabled]="false"`
   */
  readonly blocked: Signal<boolean>;
  /**
   * `true` while a co-hosted `cngxAsyncClick` is pending or the host reflects a run of its own.
   * The immediate truth, without the busy layer's show delay.
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
 * DI token every host on `CngxButtonBrain` provides on its own element. A split button reads its
 * main action through it.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-state.token.ts
 * @since 0.1.0
 * @relatedTo CngxButton, CngxIconButton, CngxSplitButton
 */
export const CNGX_BUTTON_STATE = new InjectionToken<CngxButtonState>('CngxButtonState');
