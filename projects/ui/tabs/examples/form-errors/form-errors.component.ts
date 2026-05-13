import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { startWith } from 'rxjs/operators';

import { injectErrorAggregator } from '@cngx/common/interactive';
import { CngxTab, CngxTabContent } from '@cngx/common/tabs';
import { CngxTabGroup } from '@cngx/ui/tabs';

/**
 * Per-tab form error aggregation.
 *
 * Each `[cngxTab]` binds `[errorAggregator]` to a `CngxErrorAggregator`
 * built with `injectErrorAggregator`. The aggregator's source signal reads
 * the form group's `statusChanges` (via `toSignal` + `startWith`) and the
 * matching tab header gains a `cngx-tabs__badge` plus an SR descriptor
 * span — fully signal-derived, no manual toggles. Both tabs start with
 * valid pre-filled values; clear a field to trigger its badge. The two
 * aggregators are independent — fixing one tab does not affect the other.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CngxTabGroup, CngxTab, CngxTabContent],
  template: `
    <p style="margin: 0 0 12px; opacity: 0.8; font-size: 0.875rem">
      Two tabs, each bound to a reactive <code>FormGroup</code>. Clear a
      field — the per-tab error aggregator reads
      <code>statusChanges</code> and a badge lights up on the tab header.
    </p>
    <cngx-tab-group aria-label="Form error aggregation demo">
      <div cngxTab label="Profile" [errorAggregator]="profileErrors">
        <ng-template cngxTabContent>
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
        </ng-template>
      </div>
      <div cngxTab label="Account" [errorAggregator]="accountErrors">
        <ng-template cngxTabContent>
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
        </ng-template>
      </div>
      <div cngxTab label="Notifications">
        <ng-template cngxTabContent>
          <p style="padding: 12px">No aggregator bound — no badge on this tab.</p>
        </ng-template>
      </div>
    </cngx-tab-group>
  `,
})
export class FormErrorsExample {
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
