import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { startWith } from 'rxjs/operators';

import { injectErrorAggregator } from '@cngx/common/interactive';
import { CngxMatTabError, CngxMatTabs } from '@cngx/ui/mat-tabs';

/**
 * Per-tab form error aggregation on `<mat-tab-group>`.
 *
 * A single `cngxMatTabs` attribute wires the existing `<mat-tab-group>`
 * into the cngx tab-handle registry. Each `<mat-tab>` then accepts
 * `[cngxMatTabError]` bound to a `CngxErrorAggregator` built with
 * `injectErrorAggregator`. The aggregator's source signal reads
 * `statusChanges` (via `toSignal` + `startWith`) and the matching
 * Material tab header gains a `cngx-mat-tab--has-errors` badge plus
 * an SR descriptor span — fully signal-derived, no manual toggles.
 * Both tabs start with valid pre-filled values; clear a field and
 * switch tabs to watch the badge appear on the header.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTabsModule, ReactiveFormsModule, CngxMatTabs, CngxMatTabError],
  template: `
    <p style="margin: 0 0 12px; opacity: 0.8; font-size: 0.875rem">
      Vanilla <code>&lt;mat-tab-group&gt;</code> + <code>cngxMatTabs</code>.
      Clear a field — the per-tab error aggregator reads
      <code>statusChanges</code> and a badge lights up on the tab header.
    </p>
    <mat-tab-group cngxMatTabs aria-label="Form error aggregation demo">
      <mat-tab label="Profile" [cngxMatTabError]="profileErrors">
        <form
          [formGroup]="profileForm"
          style="display: flex; flex-direction: column; gap: 8px; padding: 12px"
        >
          <label style="display: flex; flex-direction: column; gap: 4px">
            <span>Name</span>
            <input type="text" formControlName="name" />
          </label>
          <small style="opacity: 0.7">Required, min 2 characters</small>
        </form>
      </mat-tab>
      <mat-tab label="Account" [cngxMatTabError]="accountErrors">
        <form
          [formGroup]="accountForm"
          style="display: flex; flex-direction: column; gap: 8px; padding: 12px"
        >
          <label style="display: flex; flex-direction: column; gap: 4px">
            <span>Email</span>
            <input type="email" formControlName="email" />
          </label>
          <small style="opacity: 0.7">Required, valid email format</small>
        </form>
      </mat-tab>
      <mat-tab label="Notifications">
        <p style="padding: 12px">No aggregator bound — no badge on this tab.</p>
      </mat-tab>
    </mat-tab-group>
  `,
})
export class MatTabsFormErrorsExample {
  protected readonly profileForm = new FormGroup({
    name: new FormControl('Jane Doe', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
  });
  protected readonly accountForm = new FormGroup({
    email: new FormControl('jane@example.com', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  private readonly profileStatus = toSignal(
    this.profileForm.statusChanges.pipe(startWith(this.profileForm.status)),
    { initialValue: this.profileForm.status },
  );
  private readonly accountStatus = toSignal(
    this.accountForm.statusChanges.pipe(startWith(this.accountForm.status)),
    { initialValue: this.accountForm.status },
  );

  protected readonly profileErrors = injectErrorAggregator(
    undefined,
    { profile: computed(() => this.profileStatus() === 'INVALID') },
    undefined,
    { profile: 'Profile name is required (min 2 chars)' },
  );
  protected readonly accountErrors = injectErrorAggregator(
    undefined,
    { account: computed(() => this.accountStatus() === 'INVALID') },
    undefined,
    { account: 'Account email must be valid' },
  );
}
