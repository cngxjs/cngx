# CngxMatPaginator

Material paginator wrapper connecting to a CngxPaginate directive via explicit `[cngxPaginateRef]` input.

## Import

```typescript
import { CngxMatPaginator } from '@cngx/ui/material';
```

## Quick Start

```typescript
import { Component, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { CngxPaginate } from '@cngx/common/data';
import { CngxMatPaginator } from '@cngx/ui/material';

@Component({
  selector: 'app-example',
  template: `
    <div cngxPaginate #pg="cngxPaginate" [total]="items.length">
      <table mat-table [dataSource]="paginatedItems()">
        <!-- table columns -->
      </table>
    </div>
    <cngx-mat-paginator [cngxPaginateRef]="pg" />
  `,
  imports: [MatTableModule, CngxMatPaginator],
})
export class ExampleComponent {
  readonly items = [];

  readonly paginatedItems = computed(() => {
    const pg = inject(CngxPaginate);
    return this.items.slice(
      pg.pageIndex() * pg.pageSize(),
      (pg.pageIndex() + 1) * pg.pageSize()
    );
  });
}
```

## Overview

`CngxMatPaginator` is a Material Design paginator component that wraps the Material `mat-paginator` element and wires it to a `CngxPaginate` directive. It provides:

- **Type-safe integration** — Explicit `[cngxPaginateRef]` input (no ancestor injection)
- **Automatic state sync** — Page index, page size, and total count are automatically synchronized
- **Page size selector** — Customizable page size options via `[pageSizeOptions]`
- **Disabled state** — Paginator disables when `CngxPaginate.isBusy()` is true

The component requires an explicit reference to the `CngxPaginate` directive instance — no hidden ancestor injection, no implicit wiring.

## API

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| cngxPaginateRef | `CngxPaginate` | required | The `CngxPaginate` directive instance to connect to. Must be obtained via template reference variable (`#pg="cngxPaginate"`). |
| pageSizeOptions | `number[]` | `[5, 10, 25]` | Options for the page-size selector dropdown. |

## Signals

None exposed directly. Use `ref.pageIndex()`, `ref.pageSize()`, and `ref.total()` from the directive instance.

## Accessibility

`CngxMatPaginator` delegates accessibility to Material's `mat-paginator` component. The Material paginator is fully accessible with:

- **ARIA labels** — Paginator navigation and page size controls are properly labeled
- **Keyboard navigation** — Tab order and keyboard shortcuts for page navigation
- **Disabled state** — When `isBusy()` is true, controls are disabled and announced to screen readers

## Composition

`CngxMatPaginator` composes:

- **Material paginator** — `mat-paginator` component from `@angular/material/paginator`
- **CngxPaginate directive** — Manages pagination state (page index, page size, total)
- **Event handling** — Subscribes to Material paginator's `page` event and updates directive state

## How It Works

1. **Setup** — Consumer applies `cngxPaginate` on a container element and assigns a template reference
2. **Data binding** — Consumer passes `[total]="items.length"` to the directive
3. **Component wire-up** — `CngxMatPaginator` binds to the directive via `[cngxPaginateRef]`
4. **State sync** — Component reads `ref.pageIndex()`, `ref.pageSize()`, `ref.total()` and binds to Material's `mat-paginator`
5. **User interaction** — When user changes page or page size, Material's `page` event fires
6. **State update** — `CngxMatPaginator.handlePage()` calls `ref.setPageSize()` and `ref.setPage()` to update directive state
7. **Data refresh** — Consumer reactively filters/slices data based on directive signals

## Examples

### Basic Table Pagination

```typescript
readonly items = signal([...data]);
readonly pg = inject(CngxPaginate);

readonly paginatedItems = computed(() => {
  const start = this.pg.pageIndex() * this.pg.pageSize();
  const end = start + this.pg.pageSize();
  return this.items().slice(start, end);
});

<div cngxPaginate #pg="cngxPaginate" [total]="items.length">
  <table mat-table [dataSource]="paginatedItems()">
    <tr mat-header-row></tr>
    @for (item of paginatedItems(); track item.id) {
      <tr mat-row></tr>
    }
  </table>
</div>
<cngx-mat-paginator [cngxPaginateRef]="pg" />
```

### With SmartDataSource

```typescript
@Component({
  template: `
    <div cngxPaginate #pg="cngxPaginate" [total]="ds.filteredCount()">
      <mat-table [dataSource]="ds" />
    </div>
    <cngx-mat-paginator [cngxPaginateRef]="pg" />
  `,
})
export class MyComponent {
  readonly ds = injectSmartDataSource(
    () => this.http.get('/api/items')
  );
}
```

The `injectSmartDataSource` automatically wires `CngxPaginate` from the injector context. The paginator component reads the directive and handles page change events.

### Custom Page Size Options

```typescript
<div cngxPaginate #pg="cngxPaginate" [total]="items.length">
  <mat-table [dataSource]="paginatedItems()" />
</div>
<cngx-mat-paginator [cngxPaginateRef]="pg" [pageSizeOptions]="[10, 25, 50, 100]" />
```

### Disabled During Loading

```typescript
readonly state = injectAsyncState(() => this.loadData$);

<!-- Paginator automatically disables when isBusy() -->
<div cngxPaginate #pg="cngxPaginate" [total]="state().filteredCount()">
  <mat-table [dataSource]="state().data()" />
</div>
<cngx-mat-paginator [cngxPaginateRef]="pg" />
```

### Reset on Filter Change

```typescript
handleFilterChange(): void {
  this.pg.setPage(0);  // Reset to first page when filters change
  // data source updates automatically
}

<div cngxPaginate #pg="cngxPaginate" [total]="items.length">
  <input (change)="handleFilterChange()" />
  <mat-table [dataSource]="paginatedItems()" />
</div>
<cngx-mat-paginator [cngxPaginateRef]="pg" />
```

## Material Theming

`CngxMatPaginator` uses the standard Material `mat-paginator` component, which inherits theming from your Material theme automatically. No additional theme configuration needed — include the Material theme in your global stylesheet.

```scss
@use '@angular/material' as mat;

$theme: mat.define-theme((...));

html {
  @include mat.all-component-themes($theme);
}
```

## See Also

- [CngxPaginate](../../../common/src/lib/data/paginate.ts) — Pagination directive
- [SmartDataSource](../../../common/src/lib/data/smart-data-source.ts) — Auto-wiring data source
- [compodoc API documentation](../../../../../docs)
- [Material Paginator Documentation](https://material.angular.io/components/paginator/overview)
- Demo: `dev-app/src/app/demos/ui/paginator-demo/`
- Tests: `projects/ui/material/src/mat-paginator.spec.ts`
