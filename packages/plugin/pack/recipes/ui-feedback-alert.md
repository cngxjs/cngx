---
title: "CngxAlert: state driven visibility"
whenToUse: "Async-state-driven alert: the same alert switches severity and message as the state transitions through loading, success, error, and idle without any manual show/hide wiring."
symbols: [CngxAlert, CngxAlertAction, CngxAlertIcon]
---

# CngxAlert: state driven visibility

Async-state-driven alert: the same alert switches severity and message as the state transitions through loading, success, error, and idle without any manual show/hide wiring.

## Symbols

- `CngxAlert`
- `CngxAlertAction`
- `CngxAlertIcon`

## Wiring

```
protected readonly saveState = createManualState<string>();
  protected simulateError(): void {
    this.saveState.setError('Network timeout');
  }
  protected simulateSuccess(): void {
    this.saveState.setSuccess('done');
  }
  protected simulateLoading(): void {
    this.saveState.set('loading');
  }
  protected resetState(): void {
    this.saveState.reset();
  }
```
