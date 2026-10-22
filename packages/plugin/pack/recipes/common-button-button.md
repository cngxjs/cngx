---
title: "CngxButton: Busy with cngxAsyncClick"
whenToUse: "The button does not own async state; cngxAsyncClick on the same element does. While its action is pending the button keeps the label in the layout (invisible), so the width never jumps, and draws a spinner ring over it. aria-busy, the double-click guard and the success or failure announcement all stay with cngxAsyncClick. Under reduced motion the ring stops turning. Toggle the failure switch to see the error path."
symbols: [CngxButton, CngxAsyncClick]
---

# CngxButton: Busy with cngxAsyncClick

The button does not own async state; cngxAsyncClick on the same element does. While its action is pending the button keeps the label in the layout (invisible), so the width never jumps, and draws a spinner ring over it. aria-busy, the double-click guard and the success or failure announcement all stay with cngxAsyncClick. Under reduced motion the ring stops turning. Toggle the failure switch to see the error path.

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
<button cngxButton tone="primary" [cngxAsyncClick]="save" #btn="cngxAsyncClick">
  @switch (btn.status()) {
    @case ('success') { Saved }
    @case ('error') { Try again }
    @default { Save changes }
  }
</button>
```
