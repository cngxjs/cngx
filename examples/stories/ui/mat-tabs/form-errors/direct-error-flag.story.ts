import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMatTabErrorFlag: direct error flag',
  subtitle:
    "<code>[cngxMatTabErrorFlag]</code> marks one <code>&lt;mat-tab&gt;</code> of a <code>cngxMatTabs</code> group invalid from a plain <code>string | boolean</code> - no aggregator. A non-empty string is the error message, <code>true</code> marks the tab invalid without one, <code>false</code> or <code>''</code> clears it, and a bare <code>cngxMatTabErrorFlag</code> attribute counts as <code>true</code>.",
  description:
    "The flag is the simple-case sibling of <code>[cngxMatTabError]</code>. Both write a per-tab slot on the same tab handle: <code>[cngxMatTabError]</code> takes a <code>CngxErrorAggregator</code> (several sources, reveal gating, a count and an announcement - see the instrumentation story), while the flag takes the one value you already have, here derived from each Reactive form's status. The flag folds into the handle's <code>hasError()</code> and <code>errorMessage()</code> that every consumer of the tab-group host reads; the readout below shows those two signals per tab. Profile passes a message string, Account passes a bare boolean, Notifications has no flag. Clear a field to flip its tab invalid; fill it again to clear the flag. On the Material bridge the header badge and its SR descriptor are projected from the aggregator channel only, so the flag does not decorate the <code>.mat-mdc-tab</code> button; bind <code>[cngxMatTabError]</code> when the header itself must show the error.",
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['error-handling', 'integration'],
  apiComponents: ['CngxMatTabErrorFlag', 'CngxMatTabError', 'CngxMatTabs'],
  moduleImports: [
    "import { toSignal } from '@angular/core/rxjs-interop';",
    "import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';",
    "import { MatTabsModule } from '@angular/material/tabs';",
    "import { startWith } from 'rxjs/operators';",
    "import { CngxTabGroupPresenter } from '@cngx/common/tabs';",
    "import { CngxMatTabErrorFlag, CngxMatTabs } from '@cngx/ui/mat-tabs';",
  ],
  imports: ['MatTabsModule', 'ReactiveFormsModule', 'CngxMatTabs', 'CngxMatTabErrorFlag'],
  setup: `
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

  // A message string for Profile, a bare boolean for Account.
  protected readonly profileFlag = computed(() =>
    this.profileStatus() === 'INVALID' ? 'Profile name is required (min 2 characters)' : false,
  );
  protected readonly accountInvalid = computed(() => this.accountStatus() === 'INVALID');`,
  template: `
  <mat-tab-group cngxMatTabs aria-label="Settings with per-tab error flags">
    <mat-tab label="Profile" [cngxMatTabErrorFlag]="profileFlag()">
      <form [formGroup]="profileForm" style="display:flex; flex-direction:column; gap:6px; padding:12px">
        <label style="display:flex; flex-direction:column; gap:4px">
          <span>Name</span>
          <input type="text" formControlName="name" aria-describedby="flag-name-hint" />
        </label>
        <small id="flag-name-hint">Required, min 2 characters</small>
      </form>
    </mat-tab>

    <mat-tab label="Account" [cngxMatTabErrorFlag]="accountInvalid()">
      <form [formGroup]="accountForm" style="display:flex; flex-direction:column; gap:6px; padding:12px">
        <label style="display:flex; flex-direction:column; gap:4px">
          <span>Email</span>
          <input type="email" formControlName="email" aria-describedby="flag-email-hint" />
        </label>
        <small id="flag-email-hint">Required, valid email address</small>
      </form>
    </mat-tab>

    <mat-tab label="Notifications">
      <p style="padding:12px">No flag bound - this tab never turns invalid.</p>
    </mat-tab>
  </mat-tab-group>`,
  templateChromeBefore: `
  <p style="margin-bottom:12px">
    Clear the name or break the email address, then watch the readout: the tab's
    handle turns invalid, with the flag's message when it is a string.
  </p>`,
  setupChrome: `
  // The presenter is the tab-group host cngxMatTabs composes; its handles
  // carry the folded error state the flag writes.
  private readonly presenter = viewChild(CngxTabGroupPresenter);
  protected readonly handleRows = computed(() =>
    (this.presenter()?.tabs() ?? []).map((tab) => ({
      id: tab.id,
      label: tab.label() ?? '',
      hasError: tab.hasError(),
      message: tab.errorMessage() ?? 'none',
    })),
  );`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    @for (row of handleRows(); track row.id) {
      <div class="event-row">
        <span class="event-label">{{ row.label }}</span>
        <span class="event-value">hasError {{ row.hasError }} / errorMessage {{ row.message }}</span>
      </div>
    }
  </div>`,
};
