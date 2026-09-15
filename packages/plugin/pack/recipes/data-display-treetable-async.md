---
title: "CngxTreetable: Async state lifecycle"
whenToUse: "The treetable never loads anything itself: the consumer owns the data flow (createManualState here, injectAsyncState over HTTP in production) and restarts it on (retry). A bound state still in idle renders nothing, so start the load when binding. aria-busy mirrors the busy window and view transitions reach AT through a polite live region. A failure after a successful load keeps the rows on screen (content + error); the full error surface only replaces the grid when there is nothing to show."
symbols: [CngxTreetable, CngxErrorTpl, CngxEmptyTpl]
---

# CngxTreetable: Async state lifecycle

The treetable never loads anything itself: the consumer owns the data flow (createManualState here, injectAsyncState over HTTP in production) and restarts it on (retry). A bound state still in idle renders nothing, so start the load when binding. aria-busy mirrors the busy window and view transitions reach AT through a polite live region. A failure after a successful load keeps the rows on screen (content + error); the full error surface only replaces the grid when there is nothing to show.

## Symbols

- `CngxTreetable`
- `CngxErrorTpl`
- `CngxEmptyTpl`

## Setup

```ts
protected readonly loadState = createManualState<Node<Employee>[]>();
  protected readonly tree = computed(() => this.loadState.data() ?? []);
  protected readonly failNextLoad = signal(false);

  constructor() {
    this.reload();
  }

  protected reload(): void {
    this.loadState.set(this.loadState.isFirstLoad() ? 'loading' : 'refreshing');
    setTimeout(() => {
      if (this.failNextLoad()) {
        this.failNextLoad.set(false);
        this.loadState.setError(new Error('Org service unavailable'));
        return;
      }
      this.loadState.setSuccess([ORG_TREE]);
    }, 900);
  }
```

## Wiring

```html
<cngx-treetable [tree]="tree()" [state]="loadState" (retry)="reload()">
    <ng-template cngxError let-error let-retry="retry">
      <p>Load failed: {{ $any(error).message }}</p>
      <button type="button" class="chip" (click)="retry()">Retry</button>
    </ng-template>
    <ng-template cngxEmpty>
      <p>No employees loaded.</p>
    </ng-template>
  </cngx-treetable>
```
