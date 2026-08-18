---
title: "CngxCombobox: combobox async via state skipinitial searchtermchange"
whenToUse: "CngxCombobox - tag-input filter with live typeahead. Multi-value tag strip + free-text filtering, plus the same async/commit machinery as CngxSelect."
symbols: [CngxCombobox]
---

# CngxCombobox: combobox async via state skipinitial searchtermchange

CngxCombobox - tag-input filter with live typeahead. Multi-value tag strip + free-text filtering, plus the same async/commit machinery as CngxSelect.

## Symbols

- `CngxCombobox`

## Setup

```ts
protected readonly comboLastTerm = signal<string>('');
  protected readonly comboAsyncValues = signal<string[]>([]);
  protected readonly comboAsyncState: ManualAsyncState<CngxSelectOptionsInput<string>> =
    createManualState<CngxSelectOptionsInput<string>>();
```

## Wiring

```html
<cngx-combobox
    [label]="'Topics'"
    [state]="comboAsyncState"
    [(values)]="comboAsyncValues"
    [skipInitial]="true"
    (searchTermChange)="comboLastTerm.set($event)"
    placeholder="Search topics…"
  />
```
