---
title: "CngxStepper: pessimistic and optimistic commits with bridge directives"
whenToUse: "Async commit gating across both modes. Pessimistic keeps the user on the origin step until [commitAction] resolves; optimistic advances eagerly and rolls back on rejection. cngx-toast-on and cngx-banner-on compose against the presenter via DI - no [state] binding required."
symbols: [CngxStepper, CngxStepperPresenter, CngxStep, CngxStepContent]
---

# CngxStepper: pessimistic and optimistic commits with bridge directives

Async commit gating across both modes. Pessimistic keeps the user on the origin step until [commitAction] resolves; optimistic advances eagerly and rolls back on rejection. cngx-toast-on and cngx-banner-on compose against the presenter via DI - no [state] binding required.

## Symbols

- `CngxStepper`
- `CngxStepperPresenter`
- `CngxStep`
- `CngxStepContent`

## Wiring

```
<cngx-stepper
    [(activeStepIndex)]="active"
    [commitAction]="commitAction"
    [commitMode]="mode()"
    cngxToastOn
    [toastError]="'Step transition failed'"
    cngxBannerOn
    bannerId="stepper:commit-error"
    [bannerError]="'Step transition refused by the server.'"
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
```
