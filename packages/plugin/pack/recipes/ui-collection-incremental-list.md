---
title: "CngxIncrementalList: Empty"
whenToUse: "The empty view is one of the five slot regions. A projected *cngxIncrementalEmpty template replaces the default outright; a shared override can be supplied app-wide via withIncrementalListTemplates or the label re-phrased via withIncrementalListAriaLabels."
symbols: [CngxIncrementalList]
---

# CngxIncrementalList: Empty

The empty view is one of the five slot regions. A projected *cngxIncrementalEmpty template replaces the default outright; a shared override can be supplied app-wide via withIncrementalListTemplates or the label re-phrased via withIncrementalListAriaLabels.

## Symbols

- `CngxIncrementalList`

## Setup

```ts
protected readonly listState = createManualState<Person[]>();
  protected readonly pageSize = signal(5);
  constructor() {
    this.listState.setSuccess([]);
  }
```

## Wiring

```html
<cngx-incremental-list [state]="listState" [total]="0" [pageSize]="pageSize()">
    <ng-template cngxIncrementalItem let-p>
      <strong>{{ p.name }}</strong> - {{ p.role }}
    </ng-template>
  </cngx-incremental-list>
```
