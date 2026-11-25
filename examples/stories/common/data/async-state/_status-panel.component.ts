import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { createForwardedAsyncState } from '@cngx/common/data';
import { CNGX_STATEFUL, type CngxAsyncState } from '@cngx/core/utils';
import { CngxToastOn } from '@cngx/ui/feedback';

/**
 * A panel that receives its async state through an input and publishes it
 * through `CNGX_STATEFUL`. The input can be rebound or unbound at any time,
 * so the panel forwards it: `createForwardedAsyncState` returns one stable
 * object whose members read whatever is bound right now, and an unbound
 * input reads as `idle`. The bare `cngxToastOn` in the template resolves
 * `CNGX_STATEFUL` once and still follows every rebinding.
 */
@Component({
  selector: 'demo-status-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxToastOn],
  providers: [
    {
      provide: CNGX_STATEFUL,
      useFactory: () => ({ state: inject(DemoStatusPanel).forwarded }),
    },
  ],
  template: `
    <p role="status" cngxToastOn toastError="Report failed to load">
      {{ label() }}: {{ forwarded.status() }}
    </p>
  `,
})
export class DemoStatusPanel {
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);
  readonly label = input('No report');

  readonly forwarded = createForwardedAsyncState(this.state);
}
