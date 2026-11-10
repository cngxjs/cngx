---
title: "CngxToastOn: state bridge"
whenToUse: "Zero-handler integration: one [cngxToastOn] on the wrapper watches the CngxAsyncState both buttons drive and shows a success or error toast on every terminal transition. No explicit toaster.show() call. One bridge per state: a second bridge on the same state shows each toast twice (the toaster merges them into one toast with a count)."
symbols: [CngxToastOn, CngxToastOutlet, CngxToaster, CngxToast]
---

# CngxToastOn: state bridge

Zero-handler integration: one [cngxToastOn] on the wrapper watches the CngxAsyncState both buttons drive and shows a success or error toast on every terminal transition. No explicit toaster.show() call. One bridge per state: a second bridge on the same state shows each toast twice (the toaster merges them into one toast with a count).

## Symbols

- `CngxToastOn`
- `CngxToastOutlet`
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
<div class="demo-inline-actions" style="margin-bottom:12px"
  [cngxToastOn]="saveState" toastSuccess="Saved successfully" toastError="Save failed" [toastErrorDetail]="true">
  <button (click)="simulateSave()" class="chip" type="button">
    {{ saveState.isPending() ? 'Saving...' : 'Save (1.5s)' }}
  </button>
  <button (click)="simulateError()" class="chip" type="button">
    Simulate Error (1.5s)
  </button>
</div>
```
