import { inject, type Provider } from '@angular/core';
import {
  CNGX_ACTION_STATUS,
  CNGX_HOST_INTERACTION_STATE,
  type CngxHostInteractionState,
} from '@cngx/common/interactive';

import { CngxButtonBrain } from './button-brain.directive';
import { CNGX_BUTTON_HOST_STATE, type CngxButtonHostState } from './button-host.token';

/**
 * The two providers a button host on `CngxActionStatusBrain` needs, next to
 * {@link provideButtonHost}:
 *
 * - `CNGX_HOST_INTERACTION_STATE`: the brain's interaction plus the
 *   `announcement` of `CNGX_ACTION_STATUS`, so the runner's live region
 *   speaks what the host shows. A host provider beats the entry of the
 *   `CngxButtonBrain` host directive. Without it the region stays silent.
 * - `CNGX_BUTTON_HOST_STATE`: a bound `[externalState]` in flight refuses
 *   clicks and reads as busy.
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
