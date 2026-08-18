---
title: "CngxDonut: Async state machine"
whenToUse: "Drives a single donut through every async-state branch. The empty button reaches the empty view by entering success without setting data (state.reset() + state.set(\"success\")); the preset paints its empty fallback instead of a 0% ring."
symbols: [CngxDonut]
---

# CngxDonut: Async state machine

Drives a single donut through every async-state branch. The empty button reaches the empty view by entering success without setting data (state.reset() + state.set("success")); the preset paints its empty fallback instead of a 0% ring.

## Symbols

- `CngxDonut`

## Wiring

```
<cngx-donut [value]="72" [max]="100" [size]="80" [thickness]="10" [label]="'72%'" [state]="state" aria-label="Demo score" />
```
