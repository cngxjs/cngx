---
title: "CngxStackedBar: Async state machine"
whenToUse: "Array-valued chart, so the empty branch is reached by setting an empty segment list (state.setSuccess([])). The preset paints its empty fallback instead of a zero-width composite bar."
symbols: [CngxStackedBar]
---

# CngxStackedBar: Async state machine

Array-valued chart, so the empty branch is reached by setting an empty segment list (state.setSuccess([])). The preset paints its empty fallback instead of a zero-width composite bar.

## Symbols

- `CngxStackedBar`

## Wiring

```
protected readonly stateDemoSegments: readonly CngxStackedSegment[] = [
    { value: 40, color: '#4c8bf5', label: 'Active' },
    { value: 25, color: '#1f9d55', label: 'Idle' },
    { value: 15, color: '#d2452f', label: 'Errors' },
  ];
  protected readonly state = createManualState<readonly CngxStackedSegment[]>();
```
