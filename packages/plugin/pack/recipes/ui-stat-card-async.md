---
title: "CngxStatCard: Error and refresh"
whenToUse: "The treatment is pinned to skeleton here so the view switch is what you see. Left on the auto default, this demo would flip to a spinner from the second load onward - its transitions are synchronous, so the probe measures a ~0ms window and auto rightly concludes the endpoint is fast. The latency-aware story demonstrates that selection with real delays. Both branches come from resolveAsyncView, the same lookup table every other async surface in cngx uses, so the tile cannot drift from them. The accessible name drops while the stat is not rendered - the slot ids live inside the content branch, and pointing at ids that are out of the DOM reads as unnamed anyway. Set live=\"polite\" for a tile that refreshes on a timer so the new figure is announced instead of changing silently."
symbols: [CngxStatCard]
---

# CngxStatCard: Error and refresh

The treatment is pinned to skeleton here so the view switch is what you see. Left on the auto default, this demo would flip to a spinner from the second load onward - its transitions are synchronous, so the probe measures a ~0ms window and auto rightly concludes the endpoint is fast. The latency-aware story demonstrates that selection with real delays. Both branches come from resolveAsyncView, the same lookup table every other async surface in cngx uses, so the tile cannot drift from them. The accessible name drops while the stat is not rendered - the slot ids live inside the content branch, and pointing at ids that are out of the DOM reads as unnamed anyway. Set live="polite" for a tile that refreshes on a timer so the new figure is announced instead of changing silently.

## Symbols

- `CngxStatCard`

## Setup

```ts
protected readonly revenue = createManualState<number>();
```

## Wiring

```html
<cngx-stat-card
    [state]="revenue"
    loadingTreatment="skeleton"
    live="polite"
    style="max-width:260px"
  >
    <span cngxStatLabel>Revenue</span>
    <cngx-metric cngxStatValue [value]="1.2" unit="M EUR" />
    <span cngxStatCaption>vs. last quarter</span>
  </cngx-stat-card>
```
