---
title: "CngxToastOn: state bridge"
whenToUse: "Zero-handler integration: a button driven by a CngxAsyncState shows a success or error toast on every terminal transition. No explicit toaster.show() call - the bridge directive reads CNGX_STATEFUL from the host."
symbols: [CngxToastOutlet, CngxToastOn, CngxToaster, CngxToast]
---

# CngxToastOn: state bridge

Zero-handler integration: a button driven by a CngxAsyncState shows a success or error toast on every terminal transition. No explicit toaster.show() call - the bridge directive reads CNGX_STATEFUL from the host.

## Symbols

- `CngxToastOutlet`
- `CngxToastOn`
- `CngxToaster`
- `CngxToast`

## Setup

```ts
protected readonly saveState = createManualState<string>();
  protected simulateSave(): void {
    this.saveState.set('pending');
    setTimeout(() => this.saveState.setSuccess('done'), 1500);
  }
  protected simulateError(): void {
    this.saveState.set('pending');
    setTimeout(() => this.saveState.setError('Network timeout'), 1500);
  }
```

## Wiring

```html
<div class="button-row" style="margin-bottom:12px">
    <button (click)="simulateSave()"
      [cngxToastOn]="saveState" toastSuccess="Saved successfully" toastError="Save failed" [toastErrorDetail]="true"
      class="chip" type="button">
      {{ saveState.isPending() ? 'Saving...' : 'Save (1.5s)' }}
    </button>
    <button (click)="simulateError()"
      [cngxToastOn]="saveState" toastSuccess="Saved successfully" toastError="Save failed" [toastErrorDetail]="true"
      class="chip" type="button">
      Simulate Error (1.5s)
    </button>
  </div>
```
