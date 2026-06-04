import { ChangeDetectionStrategy, Component } from '@angular/core';

import { createManualState } from '@cngx/common/data';
import { CngxBannerOn, CngxBannerOutlet, CngxToastOn, CngxToastOutlet } from '@cngx/ui/feedback';

// Re-export triggers compodocx file-walker so app.config.ts lands in the
// StackBlitz manifest as src/app/app.config.ts, overriding the hardcoded
// stub — the only way to inject EnvironmentProviders into the playground.
export { appConfig } from './app.config';

/**
 * Async-state bridges — toast + banner without service plumbing.
 *
 * One `createManualState<string>()` slot drives two declarative bridges
 * (`cngxToastOn`, `cngxBannerOn`) attached to the same host element.
 * The bridges read the state via input binding (`[cngxToastOn]="saveState"`)
 * and react to status transitions: `loading → success` fires a success
 * toast; `loading → error` fires an error toast AND opens a banner. No
 * subscriptions, no `inject(CngxToaster)`, no `show()` calls.
 *
 * Same pattern composes with any `CngxAsyncState` producer — `injectAsyncState`,
 * `fromResource`, `fromHttpResource`, the manual state shown here, or a
 * commit-action's exposed `commitState` (see Example 3 / 6).
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxToastOn, CngxBannerOn, CngxToastOutlet, CngxBannerOutlet],
  template: `
    <p style="margin: 0 0 12px; opacity: 0.8; font-size: 0.875rem">
      One <code>createManualState</code> slot drives both bridges on the
      same element. Click a button to push the state through
      <code>loading → success</code> or <code>loading → error</code> and
      watch the toast / banner appear without any explicit
      <code>show()</code> call.
    </p>
    <div
      [cngxToastOn]="saveState"
      [toastSuccess]="'Saved'"
      [toastError]="'Save failed'"
      [cngxBannerOn]="saveState"
      bannerId="save:error"
      [bannerError]="'Save failed — check your connection.'"
      style="display: flex; gap: 8px; flex-direction: column; align-items: flex-start"
    >
      <div style="display: flex; gap: 8px">
        <button type="button" (click)="simulateSuccess()">
          Simulate success
        </button>
        <button type="button" (click)="simulateError()">
          Simulate error
        </button>
      </div>
      <p>Status: {{ saveState.status() }}</p>
    </div>

    <cngx-toast-outlet />
    <cngx-banner-outlet />
  `,
})
export class BridgesExample {
  protected readonly saveState = createManualState<string>();

  protected simulateSuccess(): void {
    this.saveState.set('loading');
    setTimeout(() => this.saveState.setSuccess('Saved!'), 1200);
  }

  protected simulateError(): void {
    this.saveState.set('loading');
    setTimeout(() => this.saveState.setError('Server error'), 1200);
  }
}
