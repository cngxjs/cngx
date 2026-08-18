---
title: "CngxMiniArea: Async state machine"
whenToUse: "Array-valued chart: an empty array is a natural empty state, so the four-state machine collapses to state.setSuccess([]) for the empty button. The other three states follow the standard contract."
symbols: [CngxMiniArea]
---

# CngxMiniArea: Async state machine

Array-valued chart: an empty array is a natural empty state, so the four-state machine collapses to state.setSuccess([]) for the empty button. The other three states follow the standard contract.

## Symbols

- `CngxMiniArea`

## Wiring

```
protected readonly stateDemoData: readonly number[] = [10, 14, 18, 16, 22, 28, 32];
  protected readonly state = createManualState<readonly number[]>();
```
