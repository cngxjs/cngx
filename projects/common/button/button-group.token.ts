import { InjectionToken, type Signal } from '@angular/core';

import type { CngxButtonSize, CngxButtonVariant } from './button.types';

/**
 * What a button group hands its children. `undefined` falls through to the config.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-group.token.ts
 * @since 0.1.0
 * @relatedTo CNGX_BUTTON_GROUP, CngxButtonGroup
 */
export interface CngxButtonGroupContext {
  readonly variant: Signal<CngxButtonVariant | undefined>;
  readonly size: Signal<CngxButtonSize | undefined>;
}

/**
 * Provided by a button group so children read it without importing the group class.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-group.token.ts
 * @since 0.1.0
 * @relatedTo CngxButton, CngxButtonGroup, CngxButtonGroupAddon, CngxButtonBrain
 */
export const CNGX_BUTTON_GROUP = new InjectionToken<CngxButtonGroupContext>('CngxButtonGroup');
