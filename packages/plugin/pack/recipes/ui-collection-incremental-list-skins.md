---
title: "CngxIncrementalList: Card skin"
whenToUse: "skin=\"card\" sits the list on an elevated, rounded surface with row dividers - surface, border, and radius all derive from the foundation tokens (and --mat-sys-* under a Material theme). Structure and ARIA are unchanged."
symbols: [CngxIncrementalList]
---

# CngxIncrementalList: Card skin

skin="card" sits the list on an elevated, rounded surface with row dividers - surface, border, and radius all derive from the foundation tokens (and --mat-sys-* under a Material theme). Structure and ARIA are unchanged.

## Symbols

- `CngxIncrementalList`

## Setup

```ts
protected readonly people: Person[] = PEOPLE.slice(0, 5);
  protected readonly listState = createManualState<Person[]>();
  constructor() {
    this.listState.setSuccess(this.people);
  }
```

## Wiring

```html
<cngx-incremental-list skin="card" [state]="listState" [total]="people.length" [pageSize]="5">
    <ng-template cngxIncrementalItem let-p>
      <strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}
    </ng-template>
  </cngx-incremental-list>
```
