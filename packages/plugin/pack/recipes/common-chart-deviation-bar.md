---
title: "CngxDeviationBar: Async state machine"
whenToUse: "Same four-state machine the other chart presets follow. Empty is reached by entering success without setting data (state.reset() + state.set(\"success\")); the preset paints its empty fallback rather than the bar."
symbols: [CngxDeviationBar]
---

# CngxDeviationBar: Async state machine

Same four-state machine the other chart presets follow. Empty is reached by entering success without setting data (state.reset() + state.set("success")); the preset paints its empty fallback rather than the bar.

## Symbols

- `CngxDeviationBar`

## Wiring

```
<cngx-deviation-bar [value]="35" [magnitude]="100" [state]="state" aria-label="Demo variance" />
```
