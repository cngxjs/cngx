---
title: "CngxStepper: pessimistic and optimistic commits with bridge directives"
whenToUse: "Async commit gating across both modes. Pessimistic keeps the user on the origin step until [commitAction] resolves; optimistic advances eagerly and rolls back when the commit does not land. A throw or an erroring observable is a failure: the commit state goes to error and the bridges report it. Answering false is a refusal: the step rolls back, the stepper announces it, lastOutcome() reads refused and the commit state goes back to idle with its data, so no bridge fires. To toast a refusal, the action shows its own warning toast before it answers false; the visible reason below the stepper is driven by lastOutcome()."
symbols: [CngxStepper, CngxStepperPresenter, CngxStep, CngxStepContent]
---

# CngxStepper: pessimistic and optimistic commits with bridge directives

Async commit gating across both modes. Pessimistic keeps the user on the origin step until [commitAction] resolves; optimistic advances eagerly and rolls back when the commit does not land. A throw or an erroring observable is a failure: the commit state goes to error and the bridges report it. Answering false is a refusal: the step rolls back, the stepper announces it, lastOutcome() reads refused and the commit state goes back to idle with its data, so no bridge fires. To toast a refusal, the action shows its own warning toast before it answers false; the visible reason below the stepper is driven by lastOutcome().

## Symbols

- `CngxStepper`
- `CngxStepperPresenter`
- `CngxStep`
- `CngxStepContent`

## Setup

```ts
private readonly toaster = inject(CngxToaster);
protected readonly active = signal(0);
protected readonly mode = signal<'optimistic' | 'pessimistic'>('pessimistic');
protected readonly shouldFail = signal(false);
protected readonly shouldRefuse = signal(false);
protected readonly latencyMs = signal(800);
protected readonly commitAction: CngxStepperCommitAction = (from, to) => {
  const ms = this.latencyMs();
  const fail = this.shouldFail();
  const refuse = this.shouldRefuse();
  return new Observable<boolean>((sub) => {
    const handle = setTimeout(() => {
      if (fail) {
        sub.error(new Error('Could not save step ' + from + ' -> ' + to));
        return;
      }
      if (refuse) {
        // A refusal is the action's own decision: it toasts its reason
        // itself, then answers false. The bridges stay silent.
        this.toaster.show({ message: 'Save the profile first.', severity: 'warning' });
        sub.next(false);
        sub.complete();
        return;
      }
      sub.next(true);
      sub.complete();
    }, ms);
    return () => clearTimeout(handle);
  });
};
```

## Wiring

```html
<cngx-stepper
  #wizard="cngxStepper"
  [(activeStepIndex)]="active"
  [commitAction]="commitAction"
  [commitMode]="mode()"
  cngxToastOn
  [toastSuccess]="'Step saved'"
  [toastError]="'Step transition failed'"
  cngxBannerOn
  bannerId="stepper:commit-error"
  [bannerError]="'The server could not save the step.'"
  aria-label="Async wizard"
>
  <div cngxStep label="Customer">
    <ng-template cngxStepContent><p>Customer details.</p></ng-template>
  </div>
  <div cngxStep label="Payment">
    <ng-template cngxStepContent><p>Payment method.</p></ng-template>
  </div>
  <div cngxStep label="Confirm">
    <ng-template cngxStepContent><p>Review the order.</p></ng-template>
  </div>
</cngx-stepper>
@if (wizard.presenter.lastFailedIndex() !== undefined && wizard.presenter.lastOutcome()?.kind === 'refused') {
  <p>Not allowed yet: save the profile first.</p>
}
```
