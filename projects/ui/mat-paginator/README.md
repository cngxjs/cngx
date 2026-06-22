# @cngx/ui/mat-paginator

Material paginator instrumentation, backed by the signal-native `CngxPaginate`
brain: `CngxMatPaginator` - the `[cngxMatPaginator]` bridge for **in-place
adoption** of a `<mat-paginator>` you already own.

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

For fresh markup over a brain you place yourself, use `<cngx-paginator>` from
`@cngx/ui/paginator` (skinnable, segment-composed) or place `CngxPaginate`
directly and render your own controls.

## Beyond a plain `<mat-paginator>`

The bridge adds three behaviours Material's paginator has no answer for.

### `[resetOn]` - reset to the first page on upstream change

Bind the sort / filter / search value the result set depends on. When it changes
(after the initial render) the paginator jumps to page 0, so a narrowed result
never strands the user on a now-empty page. The mounting value is captured
without resetting, and an already-first paginator stays put.

```html
<mat-paginator cngxMatPaginator [total]="filtered().length" [resetOn]="search()"></mat-paginator>
```

Bind a primitive or a `computed`. An inline array / object literal recomputes
every change-detection pass and would reset on each.

### `[announce]` - speak page changes to assistive tech

`<mat-paginator>` only relabels its own range text, which a screen reader does not
announce. With `[announce]` the bridge mounts a visually-hidden `aria-live`
region and speaks the new page plus visible range after every change. Localise
the wording via `[announceLabel]`.

```html
<mat-paginator cngxMatPaginator [total]="items().length" announce></mat-paginator>
```

```typescript
import type { CngxMatPaginatorAnnounceContext } from '@cngx/ui/mat-paginator';

protected readonly label = (c: CngxMatPaginatorAnnounceContext) =>
  `Seite ${c.page} von ${c.totalPages}, Einträge ${c.start} bis ${c.end} von ${c.total}`;
```

```html
<mat-paginator cngxMatPaginator [total]="items().length" announce [announceLabel]="label"></mat-paginator>
```

### `[cngxPaginateRouting]` - deep-linkable, back-button-safe URLs

The generic routing directive from `@cngx/common/data` persists the page / size
in the URL query string, so a paginated view survives reload, back, and forward.
Drop it on the same `<mat-paginator>`; it reads the brain off the shared element
injector. Re-exported from this entry for discoverability.

```html
<mat-paginator cngxMatPaginator cngxPaginateRouting [total]="items().length"></mat-paginator>
```

The page is written 1-based (`?page=2`); the brain stays 0-based. Two paginators
on one route need distinct names via `[cngxPaginatePageParam]` /
`[cngxPaginateSizeParam]`. Requires `@angular/router` (`provideRouter`); without
it the directive is an inert no-op.

`[resetOn]` and `[cngxPaginateRouting]` are not Material-specific - they work on
the `<cngx-paginator>` shell and a bare `cngxPaginate` host too. See
`@cngx/common/data` for the brain-level `CngxPaginateResetOn` /
`CngxPaginateRouting` directives.

## Accessibility

The bridge delegates accessibility to Material's `mat-paginator`: labelled
navigation and page-size controls, keyboard navigation, and a disabled state that
is announced when `isBusy()` is true. `disabled` is written reactively, so the
rendered controls reflect busy state on every change. `aria-busy` on the host
communicates the updating state. Opt into `[announce]` for spoken page-change
feedback (see above) - the one thing Material's paginator does not provide.

## Material theming

The bridge uses the standard Material `mat-paginator`, which inherits theming from
your Material theme automatically. No additional configuration is needed - include
the Material theme in your global stylesheet.

```scss
@use '@angular/material' as mat;

html {
  @include mat.all-component-themes($theme);
}
```
