---
title: "CngxTypeahead: typeahead async state load error retry"
whenToUse: "CngxTypeahead - scalar async autocomplete. Single-value input bound to an async option source with typed-form-field, commit-action and slot-override support."
symbols: [CngxTypeahead]
---

# CngxTypeahead: typeahead async state load error retry

CngxTypeahead - scalar async autocomplete. Single-value input bound to an async option source with typed-form-field, commit-action and slot-override support.

## Symbols

- `CngxTypeahead`

## Wiring

```
protected readonly typeaheadUsers: CngxSelectOptionDef<{ id: number; name: string }>[] = [
    { value: { id: 1, name: 'Alice Meier' },  label: 'Alice Meier' },
    { value: { id: 2, name: 'Bob Schmidt' },  label: 'Bob Schmidt' },
    { value: { id: 3, name: 'Charlotte Fischer' }, label: 'Charlotte Fischer' },
    { value: { id: 4, name: 'David Weber' }, label: 'David Weber' },
    { value: { id: 5, name: 'Eva Wagner' }, label: 'Eva Wagner' },
  ];
  protected readonly typeaheadCompare = (a: { id: number } | undefined, b: { id: number } | undefined): boolean =>
    (a?.id ?? NaN) === (b?.id ?? NaN);
  protected readonly typeaheadDisplay = (u: { id: number; name: string }): string => u.name;
  protected readonly typeaheadAsyncState: ManualAsyncState<CngxSelectOptionsInput<{ id: number; name: string }>> =
    createManualState<CngxSelectOptionsInput<{ id: number; name: string }>>();
  protected readonly typeaheadAsyncValue = signal<{ id: number; name: string } | undefined>(undefined);
```
