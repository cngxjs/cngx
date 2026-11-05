---
title: "CngxButton: Busy with cngxAsyncClick"
whenToUse: "The button does not own async state; cngxAsyncClick on the same element does. While its action is pending the button keeps the label in the layout (invisible), so the width never jumps, and draws a spinner ring over it. aria-busy, the double-click guard and the success or failure announcement all stay with cngxAsyncClick. Under reduced motion the ring stops turning. The label stays fixed on purpose: swapping it per status would change the accessible name under focus and the width after the run. Per-status labels belong to CngxActionButton. So the result of a run is not painted on the button at all: success and failure are spoken through the polite live region cngxAsyncClick renders next to the host. The spinner follows the loading config: a run faster than the show delay (120 ms by default) never shows the ring, and a ring that did appear stays for at least the min-dwell (400 ms) so it never flickers, and the button keeps refusing clicks for that whole held window. aria-busy and the click guard are set at the click and held until the ring releases; the spoken result fires at settle. Pick the fast run (80 ms) to see a save with no ring at all, the medium run (200 ms) to watch the ring appear and then hold through its dwell, or the slow run (1.5 s) to see the ring held through a long save. Toggle the failure switch to run the error path; the button looks the same either way, and the dashed box below mirrors what a screen reader gets."
symbols: [CngxButton, CngxAsyncClick]
---

# CngxButton: Busy with cngxAsyncClick

The button does not own async state; cngxAsyncClick on the same element does. While its action is pending the button keeps the label in the layout (invisible), so the width never jumps, and draws a spinner ring over it. aria-busy, the double-click guard and the success or failure announcement all stay with cngxAsyncClick. Under reduced motion the ring stops turning. The label stays fixed on purpose: swapping it per status would change the accessible name under focus and the width after the run. Per-status labels belong to CngxActionButton. So the result of a run is not painted on the button at all: success and failure are spoken through the polite live region cngxAsyncClick renders next to the host. The spinner follows the loading config: a run faster than the show delay (120 ms by default) never shows the ring, and a ring that did appear stays for at least the min-dwell (400 ms) so it never flickers, and the button keeps refusing clicks for that whole held window. aria-busy and the click guard are set at the click and held until the ring releases; the spoken result fires at settle. Pick the fast run (80 ms) to see a save with no ring at all, the medium run (200 ms) to watch the ring appear and then hold through its dwell, or the slow run (1.5 s) to see the ring held through a long save. Toggle the failure switch to run the error path; the button looks the same either way, and the dashed box below mirrors what a screen reader gets.

## Symbols

- `CngxButton`
- `CngxAsyncClick`

## Setup

```ts
protected readonly save = (): Promise<void> => this.simulateSave();
```

## Wiring

```html
<button cngxButton tone="primary" [cngxAsyncClick]="save" #btn="cngxAsyncClick">Save changes</button>
```
