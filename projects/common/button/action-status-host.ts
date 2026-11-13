import { inject, type Provider } from '@angular/core';
import {
  CNGX_ACTION_STATUS,
  CNGX_HOST_INTERACTION_STATE,
  type CngxHostInteractionState,
} from '@cngx/common/interactive';

import { CngxButtonBrain } from './button-brain.directive';
import { CNGX_BUTTON_HOST_STATE, type CngxButtonHostState } from './button-host.token';

/**
 * Providers for a button host on `CngxActionStatusBrain`, next to {@link provideButtonHost}.
 * `CNGX_HOST_INTERACTION_STATE` adds the `CNGX_ACTION_STATUS` announcement, so the runner's live
 * region speaks what the host shows (without it the region stays silent).
 * `CNGX_BUTTON_HOST_STATE` makes a bound `[externalState]` in flight refuse clicks and read busy.
 *
 * ```ts
 * @Component({
 *   selector: 'button[appSaveButton]',
 *   hostDirectives: [
 *     CngxButtonBrain,
 *     { directive: CngxAsyncClick, inputs: ['cngxAsyncClick: action'] },
 *     { directive: CngxActionStatusBrain, inputs: ['succeededLabel', 'failedLabel'] },
 *   ],
 *   providers: [
 *     provideButtonHost('appSaveButton', { defaultVariant: 'solid' }),
 *     provideActionStatusHost(),
 *   ],
 *   template: '...',
 * })
 * class AppSaveButton {}
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/action-status-host.ts
 * @since 0.1.0
 * @relatedTo provideButtonHost, CngxButtonBrain, CngxActionStatusBrain, CNGX_ACTION_STATUS, CNGX_BUTTON_HOST_STATE, CngxActionButton
 */
export function provideActionStatusHost(): Provider[] {
  return [
    {
      provide: CNGX_BUTTON_HOST_STATE,
      useFactory: (): CngxButtonHostState => {
        const status = inject(CNGX_ACTION_STATUS);
        return { refusing: status.externalBusy, busy: status.externalBusy };
      },
    },
    {
      provide: CNGX_HOST_INTERACTION_STATE,
      useFactory: (): CngxHostInteractionState => ({
        ...inject(CngxButtonBrain).interaction,
        announcement: inject(CNGX_ACTION_STATUS).announcement,
      }),
    },
  ];
}
