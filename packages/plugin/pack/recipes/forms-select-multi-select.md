---
title: "CngxMultiSelect: multi async options via state"
whenToUse: "CngxMultiSelect - multi-value selection with a chip strip trigger. Same async/commit machinery as CngxSelect; multi-specific slot overrides for chip + summary templates."
symbols: [CngxMultiSelect]
---

# CngxMultiSelect: multi async options via state

CngxMultiSelect - multi-value selection with a chip strip trigger. Same async/commit machinery as CngxSelect; multi-specific slot overrides for chip + summary templates.

## Symbols

- `CngxMultiSelect`

## Setup

```ts
protected readonly multiAsyncValues = signal<string[]>([]);
  protected readonly multiAsyncState: ManualAsyncState<CngxSelectOptionsInput<string>> =
    createManualState<CngxSelectOptionsInput<string>>();
```

## Wiring

```html
<cngx-multi-select
    [label]="'Topics'"
    [state]="multiAsyncState"
    [(values)]="multiAsyncValues"
    placeholder="Choose topics…"
  />
```
