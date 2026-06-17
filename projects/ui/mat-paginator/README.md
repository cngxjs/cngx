# @cngx/ui/mat-paginator

Material paginator instrumentation. Two shapes ship side by side, both backed by
the signal-native `CngxPaginate` brain:

- `CngxMatPaginator` - the `[cngxMatPaginator]` bridge for **in-place adoption** of
  a `<mat-paginator>` you already own.
- `CngxMatPaginatorWrapper` - the deprecated `<cngx-mat-paginator>` component that
  renders **fresh markup** bound to an external `CngxPaginate` ref.

## Bridge: in-place adoption (`CngxMatPaginator`)

Add one attribute to an existing `<mat-paginator>`; the signal-native brain takes
over its state with no DOM rewrite. The bridge composes `CngxPaginate` via
`hostDirectives`, so the consumer does not import or place the brain separately - a
sibling list reads `range()` off the exported reference.

```typescript
import { Component, signal } from '@angular/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { CngxMatPaginator } from '@cngx/ui/mat-paginator';

@Component({
  selector: 'app-example',
  imports: [MatPaginatorModule, CngxMatPaginator],
  template: `
    <ul>
      @for (item of items().slice(ref.paginate.range()[0], ref.paginate.range()[1]); track item.id) {
        <li>{{ item.label }}</li>
      }
    </ul>
    <mat-paginator
      cngxMatPaginator
      #ref="cngxMatPaginator"
      [total]="items().length"
      [pageSizeOptions]="[5, 10, 25]"
    ></mat-paginator>
  `,
})
export class ExampleComponent {
  readonly items = signal([/* ... */]);
}
```

- Bidirectional sync of `length` / `pageIndex` / `pageSize` / `disabled` against the
  brain's `computed()` graph, plus the `(page)` event forwarded back into the brain.
- `disabled` tracks `CngxPaginate.isBusy()`; navigation no-ops while a bound `[state]`
  is busy.
- `pageSizeOptions` is a bridge-owned input (a Material-render concern).
- `[total]`, `[cngxPageIndex]`, `[cngxPageSize]`, and `[state]` are forwarded to the
  composed brain.

## Wrapper: fresh markup (`CngxMatPaginatorWrapper`, deprecated)

Prefer the bridge. The wrapper renders its own `<mat-paginator>` and connects to a
`CngxPaginate` directive via an explicit `[cngxPaginateRef]` input - no ancestor
injection. It is kept for existing fresh-markup consumers and is scheduled for
removal.

```typescript
import { CngxMatPaginatorWrapper } from '@cngx/ui/mat-paginator';

// <div cngxPaginate #pg="cngxPaginate" [total]="items.length"> ... </div>
// <cngx-mat-paginator [cngxPaginateRef]="pg" />
```

## Accessibility

Both shapes delegate accessibility to Material's `mat-paginator`: labelled
navigation and page-size controls, keyboard navigation, and a disabled state that
is announced when `isBusy()` is true. The bridge writes `disabled` reactively, so
the rendered controls reflect busy state on every change.

## Material theming

Both shapes use the standard Material `mat-paginator`, which inherits theming from
your Material theme automatically. No additional configuration is needed - include
the Material theme in your global stylesheet.

```scss
@use '@angular/material' as mat;

html {
  @include mat.all-component-themes($theme);
}
```
