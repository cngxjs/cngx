import { InjectionToken, type Signal } from '@angular/core';

/**
 * State every cngx button type publishes about itself, so a composing
 * molecule reads it without importing a concrete button class.
 */
export interface CngxButtonState {
  /**
   * `true` while the button refuses activation: disabled, running a
   * co-hosted `cngxAsyncClick`, or refused by its `[enabled]="false"`.
   */
  readonly blocked: Signal<boolean>;
}

/**
 * DI token each button type provides (`useExisting`) on its own host:
 * `cngxButton`, `cngxIconButton`, `cngxMenuButton` and `cngxIconMenuButton`.
 * A split button reads its main action through it.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-state.token.ts
 * @since 0.1.0
 * @relatedTo CngxButton, CngxIconButton, CngxSplitButton
 */
export const CNGX_BUTTON_STATE = new InjectionToken<CngxButtonState>('CngxButtonState');
