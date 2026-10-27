import { InjectionToken, type Signal } from '@angular/core';

import type { CngxButtonSize, CngxButtonVariant } from './button.types';

/**
 * Contract a button group exposes to the buttons inside it. A child's own
 * input still wins; an `undefined` group value falls through to the config.
 */
export interface CngxButtonGroupContext {
  /** Emphasis the group hands to its children. */
  readonly variant: Signal<CngxButtonVariant | undefined>;
  /** Size the group hands to its children. */
  readonly size: Signal<CngxButtonSize | undefined>;
}

/**
 * DI token a button group provides (`useExisting`) so its children read
 * variant and size without importing the group class.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-group.token.ts
 * @since 0.1.0
 * @relatedTo CngxButton
 */
export const CNGX_BUTTON_GROUP = new InjectionToken<CngxButtonGroupContext>('CngxButtonGroup');
