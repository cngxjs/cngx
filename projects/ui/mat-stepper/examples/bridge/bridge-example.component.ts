import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatStepperModule } from '@angular/material/stepper';
import { Observable } from 'rxjs';

import { type CngxStepperCommitAction } from '@cngx/common/stepper';
import { CngxMatStepperBridge } from '@cngx/ui/mat-stepper';
import {
  CngxBannerOn,
  CngxBannerOutlet,
  CngxToastOn,
  CngxToastOutlet,
} from '@cngx/ui/feedback';

// Re-export forces compodocx to ship app.config.ts in the StackBlitz manifest
// - the only seam for EnvironmentProviders in the playground.
export { appConfig } from './app.config';

/**
 * Mat-stepper bridge instrumentation.
 *
 * Vanilla `<mat-stepper>` upgraded with a single attribute: `cngxMatStepper`.
 * That attribute pulls in the cngx commit-action lifecycle, the
 * `CNGX_STATEFUL` producer, and the bridge directive composition without
 * touching anything else.
 *
 * - `[commitAction]` runs an async `Observable<boolean>` between step
 *   transitions. Returning `false` or erroring vetoes the change.
 * - `[commitMode]="optimistic"` advances immediately and rolls back on
 *   rejection; `pessimistic` keeps Material on the origin step until the
 *   action resolves.
 * - `<cngx-toast-on />` and `<cngx-banner-on />` self-wire via
 *   `CNGX_STATEFUL` - zero `inject()` calls in the consumer's TS.
 *
 * Toggle the mode buttons and "simulate error" to exercise all four
 * quadrants of the commit lifecycle.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatStepperModule,
    CngxMatStepperBridge,
    CngxToastOn,
    CngxBannerOn,
    CngxToastOutlet,
    CngxBannerOutlet,
  ],
  template: `
    <p style="margin: 0 0 12px; opacity: 0.8; font-size: 0.875rem">
      Vanilla <code>&lt;mat-stepper&gt;</code> + <code>cngxMatStepper</code>.
      The directive wires the async commit-action lifecycle and the toast +
      banner bridges; tick "simulate error" and step forward to see all
      four quadrants.
    </p>
    <div
      style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px; flex-wrap: wrap"
    >
      <button
        type="button"
        (click)="mode.set('optimistic')"
        [style.fontWeight]="mode() === 'optimistic' ? 'bold' : 'normal'"
      >
        optimistic
      </button>
      <button
        type="button"
        (click)="mode.set('pessimistic')"
        [style.fontWeight]="mode() === 'pessimistic' ? 'bold' : 'normal'"
      >
        pessimistic
      </button>
      <label>
        <input
          type="checkbox"
          [checked]="shouldFail()"
          (change)="shouldFail.set($any($event.target).checked)"
        />
        simulate error
      </label>
    </div>

    <mat-stepper
      cngxMatStepper
      [(activeStepIndex)]="active"
      [commitAction]="commitAction"
      [commitMode]="mode()"
      cngxToastOn
      [toastError]="'Step transition failed'"
      cngxBannerOn
      bannerId="stepper:commit-error"
      [bannerError]="'Server rejected the step change.'"
      aria-label="Async stepper"
    >
      <mat-step label="Personal info">
        <p>Personal info form.</p>
      </mat-step>
      <mat-step label="Account">
        <p>Account details form.</p>
      </mat-step>
      <mat-step label="Confirm">
        <p>Confirm and submit.</p>
      </mat-step>
    </mat-stepper>

    <p style="margin-top: 12px">Active step: {{ active() }}</p>

    <cngx-toast-outlet />
    <cngx-banner-outlet />
  `,
})
export class StepperBridgeExample {
  protected readonly active = signal(0);
  protected readonly mode = signal<'optimistic' | 'pessimistic'>('optimistic');
  protected readonly shouldFail = signal(false);

  protected readonly commitAction: CngxStepperCommitAction = (from, to) =>
    new Observable<boolean>((sub) => {
      const handle = setTimeout(() => {
        if (this.shouldFail()) {
          sub.error(new Error('Step ' + from + ' → ' + to + ' rejected'));
        } else {
          sub.next(true);
          sub.complete();
        }
      }, 800);
      return () => clearTimeout(handle);
    });
}
