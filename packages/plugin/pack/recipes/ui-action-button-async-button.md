---
title: "CngxActionButton: Ejected host"
whenToUse: "cngxActionButton is skin over host directives; this host is another skin over the same ones. demoEjectedAction declares CngxButtonBrain (aria-disabled, the activation guard, data-busy), CngxAsyncClick (the run and the live region next to the button) and CngxActionStatusBrain (which label cell shows, and what the region speaks). provideButtonHost() names the host; provideActionStatusHost() hands the status announcement to the region and makes a bound [externalState] refuse clicks while it runs. CngxActionStatusStack on the label span of the host renders the label cells, each a [cngxActionStatusCell], so only the active cell is visible and names the button; the stack ships the one-grid-cell rule, and the host brings only its own look. A cngxSucceeded template replaces a label, and its text is what the region speaks. The fixture sits next to this story as _ejected-action.component.ts. The dashed box below mirrors what a screen reader gets for both buttons."
symbols: [CngxActionStatusBrain, CngxActionStatusStack, CngxActionStatusCell, CngxButtonBrain, CngxAsyncClick, CngxActionButton]
---

# CngxActionButton: Ejected host

cngxActionButton is skin over host directives; this host is another skin over the same ones. demoEjectedAction declares CngxButtonBrain (aria-disabled, the activation guard, data-busy), CngxAsyncClick (the run and the live region next to the button) and CngxActionStatusBrain (which label cell shows, and what the region speaks). provideButtonHost() names the host; provideActionStatusHost() hands the status announcement to the region and makes a bound [externalState] refuse clicks while it runs. CngxActionStatusStack on the label span of the host renders the label cells, each a [cngxActionStatusCell], so only the active cell is visible and names the button; the stack ships the one-grid-cell rule, and the host brings only its own look. A cngxSucceeded template replaces a label, and its text is what the region speaks. The fixture sits next to this story as _ejected-action.component.ts. The dashed box below mirrors what a screen reader gets for both buttons.

## Symbols

- `CngxActionStatusBrain`
- `CngxActionStatusStack`
- `CngxActionStatusCell`
- `CngxButtonBrain`
- `CngxAsyncClick`
- `CngxActionButton`

## Setup

```ts
protected readonly save = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 1200));

protected readonly remove = (): Promise<void> =>
  new Promise((_, reject) => setTimeout(() => reject(new Error('403 Forbidden')), 1000));
```

## Wiring

```html
<div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">
  <button demoEjectedAction [action]="save" pendingLabel="Saving...">
    Save draft
    <ng-template cngxSucceeded>Draft saved</ng-template>
  </button>
  <button demoEjectedAction [action]="remove" pendingLabel="Deleting..." failedLabel="Not allowed">
    Delete
  </button>
</div>
```
