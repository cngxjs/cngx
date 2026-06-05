import { ChangeDetectionStrategy, Component, signal, ViewEncapsulation } from '@angular/core';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Observable } from 'rxjs';

import {
  type CngxStepperCommitAction,
  CngxStepperComplete,
  CngxStepperNext,
  CngxStepperPrevious,
} from '@cngx/common/stepper';
import { CngxMatStepperBridge } from '@cngx/ui/mat-stepper';
import {
  CngxStepperFooter,
  CngxStepperFooterEnd,
  CngxStepperFooterStart,
} from '@cngx/ui/stepper';
import { CngxBannerOn, CngxBannerOutlet, CngxToastOn, CngxToastOutlet } from '@cngx/ui/feedback';

// Re-export forces compodocx to ship app.config.ts in the StackBlitz manifest
// - the only seam for EnvironmentProviders in the playground.
export { appConfig } from './app.config';

/**
 * Mat-stepper bridge - everything the instrumentation directive offers.
 *
 * A vanilla `<mat-stepper>` upgraded with one attribute, `cngxMatStepper`,
 * pulling in the whole cngx stepper brain without touching Material's
 * rendering:
 *
 * - **Async commit lifecycle.** `[commitAction]` runs an `Observable`
 *   between transitions; `[commitMode]` picks `optimistic` (advance now,
 *   roll back on rejection) or `pessimistic` (hold until it resolves).
 * - **Feedback bridges.** `cngxToastOn` / `cngxBannerOn` self-wire off
 *   `CNGX_STATEFUL` - the rejection surfaces as a toast and a banner with
 *   zero `inject()` in the consumer.
 * - **cngx footer drives navigation.** `<cngx-stepper-footer>` binds the
 *   shared `CNGX_STEPPER_HOST` via `[host]="s.presenter"`, so Back /
 *   Continue / Finish replace `matStepperPrevious` / `matStepperNext`.
 *   `cngxStepperComplete` runs an async finish action on the last step.
 * - **Native Material chrome.** Per-step validation rides Material's own
 *   `[hasError]` + `errorMessage`; the indicator icons are overridden the
 *   native way through `<ng-template matStepperIcon>`.
 *
 * Toggle the mode and the two checkboxes to exercise the validation
 * channel (accept-terms) and the async-rejection channel (simulate
 * error) independently.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './bridge-example.component.scss',
  imports: [
    MatStepperModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatIconModule,
    MatCardModule,
    CngxMatStepperBridge,
    CngxStepperFooter,
    CngxStepperFooterStart,
    CngxStepperFooterEnd,
    CngxStepperPrevious,
    CngxStepperNext,
    CngxStepperComplete,
    CngxToastOn,
    CngxBannerOn,
    CngxToastOutlet,
    CngxBannerOutlet,
  ],
  template: `
    <cngx-banner-outlet />

    <mat-card appearance="outlined" style="max-width: 640px">
      <mat-card-header>
        <mat-card-title>Account setup</mat-card-title>
        <mat-card-subtitle>
          Vanilla &lt;mat-stepper&gt; upgraded with <code>cngxMatStepper</code>
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div class="bridge-demo__chrome">
          <mat-button-toggle-group
            [value]="mode()"
            (change)="mode.set($any($event).value)"
            aria-label="Commit mode"
            hideSingleSelectionIndicator
          >
            <mat-button-toggle value="optimistic">optimistic</mat-button-toggle>
            <mat-button-toggle value="pessimistic">pessimistic</mat-button-toggle>
          </mat-button-toggle-group>

          <mat-checkbox [checked]="shouldFail()" (change)="shouldFail.set($any($event.target).checked)">
            Simulate server error
          </mat-checkbox>
        </div>

        <mat-stepper
          cngxMatStepper
          #s="cngxMatStepperDirective"
          [(activeStepIndex)]="active"
          [commitAction]="commitAction"
          [commitMode]="mode()"
          cngxToastOn
          [toastError]="'Step transition failed'"
          cngxBannerOn
          bannerId="stepper:commit-error"
          [bannerError]="'The server rejected the step change.'"
          aria-label="Account setup"
        >
          <!-- Native indicator-icon overrides - no cngx slot needed. -->
          <ng-template matStepperIcon="edit"><mat-icon>edit</mat-icon></ng-template>
          <ng-template matStepperIcon="done"><mat-icon>check</mat-icon></ng-template>
          <ng-template matStepperIcon="error"><mat-icon>priority_high</mat-icon></ng-template>

          <mat-step label="Personal info">
            <p>Tell us who you are.</p>
          </mat-step>

          <!-- Validation channel: Material's own hasError + errorMessage. -->
          <mat-step
            label="Account"
            [hasError]="!accepted()"
            errorMessage="Accept the terms to continue"
          >
            <p>Choose your sign-in method.</p>
            <mat-checkbox [checked]="accepted()" (change)="accepted.set($any($event.target).checked)">
              I accept the terms
            </mat-checkbox>
          </mat-step>

          <mat-step label="Confirm">
            <p>Review everything, then finish.</p>
          </mat-step>
        </mat-stepper>

        <p class="bridge-demo__readout">
          Active step: {{ active() }} @if (done()) { &middot; submitted }
        </p>
      </mat-card-content>

      <mat-card-actions>
        <!-- The footer lives outside the stepper and is handed the host
             explicitly; its atoms drive Material via CNGX_STEPPER_HOST. -->
        <cngx-stepper-footer [host]="s.presenter" style="display: flex; gap: 8px; width: 100%">
          <button mat-button cngxStepperFooterStart cngxStepperPrevious>Back</button>
          @if (s.presenter.isLastStep()) {
            <button
              mat-raised-button
              cngxStepperFooterEnd
              [cngxStepperComplete]="finish"
              (completed)="done.set(true)"
            >
              Finish
            </button>
          } @else {
            <button mat-raised-button cngxStepperFooterEnd cngxStepperNext>Continue</button>
          }
        </cngx-stepper-footer>
      </mat-card-actions>
    </mat-card>

    <cngx-toast-outlet />
  `,
})
export class StepperBridgeExample {
  protected readonly active = signal(0);
  protected readonly mode = signal<'optimistic' | 'pessimistic'>('optimistic');
  protected readonly shouldFail = signal(false);
  protected readonly accepted = signal(false);
  protected readonly done = signal(false);

  /** Async transition gate - rejects when "simulate server error" is on. */
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

  /** Async finish action for `cngxStepperComplete` on the last step. */
  protected readonly finish = (): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, 600));
}
