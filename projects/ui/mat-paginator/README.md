# CngxMatPaginatorWrapper

Material paginator wrapper connecting to a CngxPaginate directive via explicit `[cngxPaginateRef]` input.

## Import

```typescript
import { CngxMatPaginatorWrapper } from '@cngx/ui/mat-paginator';
```

## Quick Start

```typescript
import { Component, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { CngxPaginate } from '@cngx/common/data';
import { CngxMatPaginatorWrapper } from '@cngx/ui/mat-paginator';

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
  imports: [MatTableModule, CngxMatPaginatorWrapper],
})
export class ExampleComponent {
  readonly items = [];

  readonly paginatedItems = computed(() => {
    const pg = inject(CngxPaginate);
    return this.items.slice(pg.pageIndex() * pg.pageSize(), (pg.pageIndex() + 1) * pg.pageSize());
  });
}
```

## Overview

`CngxMatPaginatorWrapper` is a Material Design paginator component that wraps the Material `mat-paginator` element and wires it to a `CngxPaginate` directive. It provides:

- **Type-safe integration** - Explicit `[cngxPaginateRef]` input (no ancestor injection)
- **Automatic state sync** - Page index, page size, and total count are automatically synchronized
- **Page size selector** - Customizable page size options via `[pageSizeOptions]`
- **Disabled state** - Paginator disables when `CngxPaginate.isBusy()` is true

The component requires an explicit reference to the `CngxPaginate` directive instance - no hidden ancestor injection, no implicit wiring.

## Accessibility

`CngxMatPaginatorWrapper` delegates accessibility to Material's `mat-paginator` component. The Material paginator is fully accessible with:

- **ARIA labels** - Paginator navigation and page size controls are properly labeled
- **Keyboard navigation** - Tab order and keyboard shortcuts for page navigation
- **Disabled state** - When `isBusy()` is true, controls are disabled and announced to screen readers

## Composition

`CngxMatPaginatorWrapper` composes:

- **Material paginator** - `mat-paginator` component from `@angular/material/paginator`
- **CngxPaginate directive** - Manages pagination state (page index, page size, total)
- **Event handling** - Subscribes to Material paginator's `page` event and updates directive state

## How It Works

1. **Setup** - Consumer applies `cngxPaginate` on a container element and assigns a template reference
2. **Data binding** - Consumer passes `[total]="items.length"` to the directive
3. **Component wire-up** - `CngxMatPaginatorWrapper` binds to the directive via `[cngxPaginateRef]`
4. **State sync** - Component reads `ref.pageIndex()`, `ref.pageSize()`, `ref.total()` and binds to Material's `mat-paginator`
5. **User interaction** - When user changes page or page size, Material's `page` event fires
6. **State update** - `CngxMatPaginatorWrapper.handlePage()` calls `ref.setPageSize()` and `ref.setPage()` to update directive state
7. **Data refresh** - Consumer reactively filters/slices data based on directive signals

## Material Theming

`CngxMatPaginatorWrapper` uses the standard Material `mat-paginator` component, which inherits theming from your Material theme automatically. No additional theme configuration needed - include the Material theme in your global stylesheet.

```scss
@use '@angular/material' as mat;

$theme: mat.define-theme((...));

html {
  @include mat.all-component-themes($theme);
}
```
