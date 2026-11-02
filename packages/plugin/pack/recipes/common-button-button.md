---
title: "CngxButton: Busy with cngxAsyncClick"
whenToUse: "The button does not own async state; cngxAsyncClick on the same element does. While its action is pending the button keeps the label in the layout (invisible), so the width never jumps, and draws a spinner ring over it. aria-busy, the double-click guard and the success or failure announcement all stay with cngxAsyncClick. Under reduced motion the ring stops turning. The label stays fixed on purpose: swapping it per status would change the accessible name under focus and the width after the run. Per-status labels belong to CngxActionButton. So the result of a run is not painted on the button at all: success and failure are spoken through the polite live region cngxAsyncClick renders next to the host. Toggle the failure switch to run the error path; the button looks the same either way, and the dashed box below mirrors what a screen reader gets."
symbols: [CngxButton, CngxAsyncClick]
---

# CngxButton: Busy with cngxAsyncClick

The button does not own async state; cngxAsyncClick on the same element does. While its action is pending the button keeps the label in the layout (invisible), so the width never jumps, and draws a spinner ring over it. aria-busy, the double-click guard and the success or failure announcement all stay with cngxAsyncClick. Under reduced motion the ring stops turning. The label stays fixed on purpose: swapping it per status would change the accessible name under focus and the width after the run. Per-status labels belong to CngxActionButton. So the result of a run is not painted on the button at all: success and failure are spoken through the polite live region cngxAsyncClick renders next to the host. Toggle the failure switch to run the error path; the button looks the same either way, and the dashed box below mirrors what a screen reader gets.

## Symbols

- `CngxButton`
- `CngxAsyncClick`

## Setup

```ts
protected readonly fail = signal(false);

protected readonly save = (): Promise<void> =>
  new Promise((resolve, reject) =>
    setTimeout(() => (this.fail() ? reject(new Error('Save failed')) : resolve()), 1500),
  );
```

## Wiring

```html
<button cngxButton tone="primary" [cngxAsyncClick]="save" #btn="cngxAsyncClick">Save changes</button>
```
