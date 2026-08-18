---
title: "cngxMatTabs: a sticky-error commit lifecycle with toast + banner bridges"
whenToUse: "One cngxMatTabs attribute upgrades a vanilla &lt;mat-tab-group&gt; with the async commit lifecycle. [commitAction] runs an Observable between tab switches; optimistic advances then rolls back on rejection, pessimistic holds on the origin. A refused switch decorates the target tab (.cngx-mat-tab--error + an SR descriptor referenced through aria-describedby; aria-invalid is form-field vocabulary and stays off a tab button) and the co-located cngxToastOn / cngxBannerOn bridges surface it - both self-wire off CNGX_STATEFUL, no inject() in the consumer. Per-tab [cngxMatTabError] badges read the forms’ statusChanges, and a second group shows the smart-overflow \"More\" affordance the directive mounts automatically."
symbols: [CngxMatTabs, CngxMatTabError]
---

# cngxMatTabs: a sticky-error commit lifecycle with toast + banner bridges

One cngxMatTabs attribute upgrades a vanilla &lt;mat-tab-group&gt; with the async commit lifecycle. [commitAction] runs an Observable between tab switches; optimistic advances then rolls back on rejection, pessimistic holds on the origin. A refused switch decorates the target tab (.cngx-mat-tab--error + an SR descriptor referenced through aria-describedby; aria-invalid is form-field vocabulary and stays off a tab button) and the co-located cngxToastOn / cngxBannerOn bridges surface it - both self-wire off CNGX_STATEFUL, no inject() in the consumer. Per-tab [cngxMatTabError] badges read the forms’ statusChanges, and a second group shows the smart-overflow "More" affordance the directive mounts automatically.

## Symbols

- `CngxMatTabs`
- `CngxMatTabError`

## Wiring

```
protected readonly mode = signal<'optimistic' | 'pessimistic'>('optimistic');
  protected readonly simulateError = signal(false);

  // One async gate drives every tab switch. When "Simulate error" is on it
  // rejects with a business-message Error, so the rejection decoration and
  // both feedback bridges fire off a single source (Pillar 2).
  protected readonly commitAction: CngxTabsCommitAction = (from, to) =>
    new Observable<boolean>((sub) => {
      const handle = setTimeout(() => {
        if (this.simulateError()) {
          sub.error(new Error('Tab ' + from + ' -> ' + to + ' refused by the server'));
        } else {
          sub.next(true);
          sub.complete();
        }
      }, 600);
      return () => clearTimeout(handle);
    });

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
