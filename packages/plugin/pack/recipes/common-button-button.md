---
title: "CngxButton: Busy with cngxAsyncClick"
whenToUse: "The button does not own async state; cngxAsyncClick on the same element does. While its action is pending the button keeps the label in the layout (invisible), so the width never jumps, and draws a spinner ring over it. aria-busy, the double-click guard and the success or failure announcement all stay with cngxAsyncClick. Under reduced motion the ring stops turning. The label stays fixed on purpose: swapping it per status would change the accessible name under focus and the width after the run. Per-status labels belong to CngxActionButton. So the result of a run is not painted on the button at all: success and failure are spoken through the polite live region cngxAsyncClick renders next to the host. The spinner follows the loading config: a run faster than the show delay (120 ms by default) never shows the ring, and a ring that did appear stays for at least the min-dwell (400 ms) so it never flickers, and the button keeps refusing clicks for that whole held window. aria-busy and the click guard are set at the click and held until the ring releases; the spoken result fires at settle. An 80 ms save never shows the ring, a 200 ms save shows it and holds it through the dwell, and a long save keeps it for the whole run. Success and failure look the same on the button; only the announcement differs."
symbols: [CngxButton, CngxAsyncClick]
---

# CngxButton: Busy with cngxAsyncClick

The button does not own async state; cngxAsyncClick on the same element does. While its action is pending the button keeps the label in the layout (invisible), so the width never jumps, and draws a spinner ring over it. aria-busy, the double-click guard and the success or failure announcement all stay with cngxAsyncClick. Under reduced motion the ring stops turning. The label stays fixed on purpose: swapping it per status would change the accessible name under focus and the width after the run. Per-status labels belong to CngxActionButton. So the result of a run is not painted on the button at all: success and failure are spoken through the polite live region cngxAsyncClick renders next to the host. The spinner follows the loading config: a run faster than the show delay (120 ms by default) never shows the ring, and a ring that did appear stays for at least the min-dwell (400 ms) so it never flickers, and the button keeps refusing clicks for that whole held window. aria-busy and the click guard are set at the click and held until the ring releases; the spoken result fires at settle. An 80 ms save never shows the ring, a 200 ms save shows it and holds it through the dwell, and a long save keeps it for the whole run. Success and failure look the same on the button; only the announcement differs.

## Symbols

- `CngxButton`
- `CngxAsyncClick`

## Setup

```ts
protected readonly save = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 80));
```

## Wiring

```html
<button cngxButton tone="primary" [cngxAsyncClick]="save" #btn="cngxAsyncClick">Save changes</button>
```
