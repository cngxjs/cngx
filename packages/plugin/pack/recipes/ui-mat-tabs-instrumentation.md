---
title: "cngxMatTabs: a sticky-error commit lifecycle with toast + banner bridges"
whenToUse: "One cngxMatTabs attribute upgrades a vanilla &lt;mat-tab-group&gt; with the async commit lifecycle. [commitAction] runs an Observable between tab switches; optimistic advances then rolls back when the commit does not land, pessimistic holds on the origin. Either way the target tab is decorated (.cngx-mat-tab--error + an SR descriptor referenced through aria-describedby; aria-invalid is form-field vocabulary and stays off a tab button). A throw or an erroring observable is a failure: the commit state goes to error and the co-located cngxToastOn / cngxBannerOn bridges report it - both self-wire off CNGX_STATEFUL, no inject() in the consumer. Answering false is a refusal: the descriptor reads the refused phrase, lastOutcome() reads refused, the commit state goes back to idle and no bridge fires; the action shows its own warning toast and the visible reason below the group is driven by lastOutcome(). Per-tab [cngxMatTabError] badges read the forms’ statusChanges, and a second group runs the same commit action under the smart-overflow \"More\" affordance the directive mounts automatically."
symbols: [CngxMatTabs, CngxMatTabError]
---

# cngxMatTabs: a sticky-error commit lifecycle with toast + banner bridges

One cngxMatTabs attribute upgrades a vanilla &lt;mat-tab-group&gt; with the async commit lifecycle. [commitAction] runs an Observable between tab switches; optimistic advances then rolls back when the commit does not land, pessimistic holds on the origin. Either way the target tab is decorated (.cngx-mat-tab--error + an SR descriptor referenced through aria-describedby; aria-invalid is form-field vocabulary and stays off a tab button). A throw or an erroring observable is a failure: the commit state goes to error and the co-located cngxToastOn / cngxBannerOn bridges report it - both self-wire off CNGX_STATEFUL, no inject() in the consumer. Answering false is a refusal: the descriptor reads the refused phrase, lastOutcome() reads refused, the commit state goes back to idle and no bridge fires; the action shows its own warning toast and the visible reason below the group is driven by lastOutcome(). Per-tab [cngxMatTabError] badges read the forms’ statusChanges, and a second group runs the same commit action under the smart-overflow "More" affordance the directive mounts automatically.

## Symbols

- `CngxMatTabs`
- `CngxMatTabError`

## Setup

```ts
private readonly toaster = inject(CngxToaster);
// One presenter per mat-tab-group, in template order: the account
// settings group first, the smart-overflow group second.
private readonly presenters = viewChildren(CngxTabGroupPresenter);
protected readonly mode = signal<'optimistic' | 'pessimistic'>('optimistic');
protected readonly outcome = signal<'accept' | 'error' | 'refusal'>('accept');
protected readonly refused = computed(() => this.isRefused(this.presenters()[0]));
protected readonly overflowRefused = computed(() => this.isRefused(this.presenters()[1]));

private isRefused(presenter: CngxTabGroupPresenter | undefined): boolean {
  return presenter?.lastFailedIndex() !== undefined && presenter?.lastOutcome()?.kind === 'refused';
}

// One async gate drives every tab switch. A failure errors the observable,
// so the decoration and both feedback bridges fire off a single source.
// A refusal answers false: the decoration still lands, the bridges stay
// silent and the action toasts its own reason.
protected readonly commitAction: CngxTabsCommitAction = (from, to) => {
  const outcome = this.outcome();
  return new Observable<boolean>((sub) => {
    const handle = setTimeout(() => {
      if (outcome === 'error') {
        sub.error(new Error('Could not save tab ' + from + ' -> ' + to));
        return;
      }
      if (outcome === 'refusal') {
        this.toaster.show({ message: 'Fix the profile first.', severity: 'warning' });
        sub.next(false);
        sub.complete();
        return;
      }
      sub.next(true);
      sub.complete();
    }, 600);
    return () => clearTimeout(handle);
  });
};

// Two Reactive forms that START invalid, so the [cngxMatTabError] badge is
// visible at load; typing a valid value clears it live through statusChanges.
protected readonly profileForm = new FormGroup({
  name: new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(2)],
  }),
});
protected readonly accountForm = new FormGroup({
  email: new FormControl('', {
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
  { profile: 'Profile name is required (min 2 characters)' },
);
protected readonly accountErrors = injectErrorAggregator(
  undefined,
  { account: computed(() => this.accountStatus() === 'INVALID') },
  undefined,
  { account: 'Account email must be a valid address' },
);

// Ten tabs in a narrow container so the directive's auto-mounted
// cngx-tab-overflow "More" affordance engages.
protected readonly overflowTabs = Array.from({ length: 10 }, (_, i) => 'Section ' + (i + 1));
```

## Wiring

```html
<section aria-label="Commit lifecycle and error bridges">
  <mat-tab-group
    cngxMatTabs
    #mt="cngxMatTabs"
    [commitAction]="commitAction"
    [commitMode]="mode()"
    cngxToastOn
    [toastError]="'Tab transition failed'"
    [toastErrorDetail]="true"
    cngxBannerOn
    bannerId="mat-tabs:commit-error"
    [bannerError]="'The server could not switch the tab.'"
    aria-label="Account settings"
  >
    <mat-tab label="Profile" [cngxMatTabError]="profileErrors">
      <form
        [formGroup]="profileForm"
        style="display:flex;flex-direction:column;gap:6px;padding:12px"
      >
        <label style="display:flex;flex-direction:column;gap:4px">
          <span>Name</span>
          <input type="text" formControlName="name" />
        </label>
        <small style="opacity:0.7">Required, min 2 characters</small>
      </form>
    </mat-tab>

    <mat-tab label="Account" [cngxMatTabError]="accountErrors">
      <form
        [formGroup]="accountForm"
        style="display:flex;flex-direction:column;gap:6px;padding:12px"
      >
        <label style="display:flex;flex-direction:column;gap:4px">
          <span>Email</span>
          <input type="email" formControlName="email" />
        </label>
        <small style="opacity:0.7">Required, valid email address</small>
      </form>
    </mat-tab>

    <mat-tab label="Notifications">
      <p style="padding:12px">No aggregator bound - this tab never gains the error badge.</p>
    </mat-tab>
  </mat-tab-group>
  @if (refused()) {
    <p>Not allowed yet: fix the profile first.</p>
  }
</section>

<section aria-label="Smart overflow" style="max-width:600px;margin-top:24px">
  <mat-tab-group
    cngxMatTabs
    [commitAction]="commitAction"
    [commitMode]="mode()"
    cngxToastOn
    [toastError]="'Tab transition failed'"
    [toastErrorDetail]="true"
    cngxBannerOn
    bannerId="mat-tabs:overflow-commit-error"
    [bannerError]="'The server could not switch the section.'"
    aria-label="Workspace sections"
  >
    @for (label of overflowTabs; track label) {
      <mat-tab [label]="label">
        <p style="padding:12px">{{ label }} content.</p>
      </mat-tab>
    }
  </mat-tab-group>
  @if (overflowRefused()) {
    <p>Not allowed yet: fix the profile first.</p>
  }
</section>
```
