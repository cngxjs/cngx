---
title: "CngxTreetable: skeleton row and refresh"
whenToUse: "The skeleton template repeats [skeletonRowCount] times (3 by default, 4 here) and receives { $implicit: index, rowCount }; the refresh template has no context. Both regions are aria-hidden: aria-busy on the host and the treetable's polite live region carry the loading and refreshing announcements, so keep both templates visual-only. The selector is cngxSkeletonRow, not cngxSkeleton, so it never collides with the [cngxSkeleton] layout atom."
symbols: [CngxTreetable, CngxSkeletonRowTpl, CngxRefreshTpl]
---

# CngxTreetable: skeleton row and refresh

The skeleton template repeats [skeletonRowCount] times (3 by default, 4 here) and receives { $implicit: index, rowCount }; the refresh template has no context. Both regions are aria-hidden: aria-busy on the host and the treetable's polite live region carry the loading and refreshing announcements, so keep both templates visual-only. The selector is cngxSkeletonRow, not cngxSkeleton, so it never collides with the [cngxSkeleton] layout atom.

## Symbols

- `CngxTreetable`
- `CngxSkeletonRowTpl`
- `CngxRefreshTpl`

## Setup

```ts
protected readonly loadState = createManualState<Node<Employee>[]>();
protected readonly tree = computed(() => this.loadState.data() ?? []);
protected readonly customSlots = signal(true);

constructor() {
  this.firstLoad();
}

protected firstLoad(): void {
  this.loadState.reset();
  this.loadState.set('loading');
  setTimeout(() => this.loadState.setSuccess([ORG_TREE]), 1500);
}

protected refresh(): void {
  this.loadState.set('refreshing');
  setTimeout(() => this.loadState.setSuccess([ORG_TREE]), 1500);
}
```

## Wiring

```html
<cngx-treetable [tree]="tree()" [state]="loadState" [skeletonRowCount]="4">
  @if (customSlots()) {
    <ng-template cngxSkeletonRow let-index let-rowCount="rowCount">
      <div class="demo-treetable-skeleton" [style.opacity]="1 - index / rowCount">
        <span class="demo-treetable-skeleton__index">{{ index + 1 }}/{{ rowCount }}</span>
        <span class="demo-treetable-skeleton__bar"></span>
      </div>
    </ng-template>
    <ng-template cngxRefresh>
      <span class="demo-treetable-refresh">Syncing the org chart</span>
    </ng-template>
  }
</cngx-treetable>
```
