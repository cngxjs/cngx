---
title: "CngxCombobox: combobox async via state skipinitial searchtermchange"
whenToUse: "CngxCombobox - tag-input filter with live typeahead. Multi-value tag strip + free-text filtering, plus the same async/commit machinery as CngxSelect."
symbols: [CngxCombobox]
---

# CngxCombobox: combobox async via state skipinitial searchtermchange

CngxCombobox - tag-input filter with live typeahead. Multi-value tag strip + free-text filtering, plus the same async/commit machinery as CngxSelect.

## Symbols

- `CngxCombobox`

## Wiring

```
protected readonly comboLastTerm = signal<string>('');
  protected readonly comboAsyncValues = signal<string[]>([]);
  protected readonly comboAsyncState: ManualAsyncState<CngxSelectOptionsInput<string>> =
    createManualState<CngxSelectOptionsInput<string>>();
```
