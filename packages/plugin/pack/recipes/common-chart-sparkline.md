---
title: "CngxSparkline: Async state machine"
whenToUse: "Array-valued chart, so the empty branch is reached by passing an empty array (state.setSuccess([])): the preset paints its empty fallback instead of an unbounded zero-length line. The other three states follow the standard contract."
symbols: [CngxSparkline]
---

# CngxSparkline: Async state machine

Array-valued chart, so the empty branch is reached by passing an empty array (state.setSuccess([])): the preset paints its empty fallback instead of an unbounded zero-length line. The other three states follow the standard contract.

## Symbols

- `CngxSparkline`

## Wiring

```
protected readonly stateDemoData: readonly number[] = [12, 18, 14, 22, 19, 28, 24];
  protected readonly state = createManualState<readonly number[]>();
```
