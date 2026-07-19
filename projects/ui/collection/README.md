# CngxIncrementalList

Append-style collection organism for load-more and infinite-scroll surfaces.

## Import

```typescript
import { CngxIncrementalList } from '@cngx/ui/collection';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxIncrementalList } from '@cngx/ui/collection';

@Component({
  selector: 'app-example',
  template: `
    <cngx-incremental-list [state]="state" [total]="total()">
      <!-- projected trigger atom (e.g. cngx-pgn-load-more) goes here -->
    </cngx-incremental-list>
  `,
  imports: [CngxIncrementalList],
})
export class ExampleComponent {
  // state is a CngxAsyncState<Item> from createAsyncState / injectAsyncState
}
```

## Overview

`CngxIncrementalList` is a content organism for the append-don't-replace pattern:
it accumulates rows across pages instead of swapping them, and switches its view
by async status - loading, content, empty, error, and end-reached. It composes
shipped primitives rather than inventing a new state machine:

- the `CngxPaginate` brain (`@cngx/common/data`) via a host directive, read
  through `cumulativeRange()` for the accumulated slice and `isLast()` for the
  end-reached branch;
- `resolveAsyncView` (`@cngx/common/data`) for the loading / content / empty /
  error switch, derived from the single `[state]` source;
- the `CNGX_PAGINATOR_HOST` contract, provided via the brain `useExisting`, so
  existing trigger atoms (`cngx-pgn-load-more`, `cngx-pgn-infinite`) drop in as
  swappable projected content.

The organism is a pure consumer: it owns no `[mode]` flag and introduces no new
`[state]` producer. Every visible region is a derivation of the bound state and
the brain signals.

Five view states render from the single `[state]` source: loading, content,
empty, error (first load), and end-reached. A subsequent-page failure
(`content+error`) keeps the accumulated rows visible and renders an inline retry
below them that fires the `(retry)` output - so a page-N error is never silently
swallowed. Supply `[trackBy]` when the bound data can be replaced or reordered so
projected item templates keep their per-row state.

## Skins

`[skin]` is a paint-only attribute reflected onto `[data-skin]`; structure, ARIA,
and behaviour are identical across values.

- `plain` (default) - browser-native list, no chrome.
- `divided` - hairline separators between rows.
- `card` - the list sits on an elevated, rounded surface.

```html
<cngx-incremental-list skin="card" [state]="state" [total]="total()">
  <ng-template cngxIncrementalItem let-item>{{ item.name }}</ng-template>
</cngx-incremental-list>
```

## Virtualization

An append feed is exactly the surface that grows to thousands of rows, where the
unbounded DOM node count becomes the bottleneck. Opt into DOM recycling with
`[virtualize]`: the content branch then renders only the rows inside a bounded
scroll viewport (plus a small overscan), with every off-window row collapsed into
a pixel spacer, so the node count stays flat while the scrollbar still reflects
the full set. Unset (the default), the render-all path is byte-for-byte unchanged
and pays nothing - the recycler is never constructed.

```html
<cngx-incremental-list
  [state]="state"
  [total]="total()"
  [virtualize]="true"
  [estimateSize]="36"
  style="--cngx-incremental-list-viewport-height: 60vh"
>
  <ng-template cngxIncrementalItem let-item>{{ item.name }}</ng-template>
  <cngx-pgn-infinite cngxIncrementalTrigger />
</cngx-incremental-list>
```

- `[virtualize]` - opt into recycling. Default `false`.
- `[estimateSize]` - initial per-row height in px, the first guess before a row
  is measured (rows self-measure afterwards, so variable heights are fine).
  Default `48`. Ignored unless `[virtualize]` is set.

**Bounded height is required.** Virtualization needs a bounded viewport to scroll
inside. Tune it with the `--cngx-incremental-list-viewport-height` custom property
on the organism host (default `60vh`); there is no `[viewportHeight]` input - a
CSS variable is the honest surface. The recycled body is the scroll node, so the
`card` skin's clipping does not interfere - the two are different elements by
design, and `card` + `[virtualize]` compose without an override.

The trigger still drives accumulation: `[virtualize]` virtualizes only
*rendering*, not the feed. A projected `cngx-pgn-load-more` / `cngx-pgn-infinite`
keeps calling `next()`, and the recycler windows whatever the accumulated slice
grows to.

Accessibility is preserved under recycling: each rendered row carries
`aria-setsize` (the accumulated total) and `aria-posinset` (its absolute index),
so a screen reader reports position against the whole set, not the window. A
polite live region announces the load-count when the accumulated total grows;
override its phrasing with `withIncrementalListAriaLabels({ loadedMore })`. When a
focused row recycles out of the window, focus moves to the nearest still-rendered
row, or back to the projected trigger when the window has none - a recycled-out
focus is never silently dropped.

## Accessibility

- The content region carries a reactive `aria-busy`, bound to the async state's
  `isBusy()` signal - never a one-time setting.
- State changes (empty, end-reached, error) surface through a polite live region
  so assistive technology is told when the collection settles.

## Composition

`CngxIncrementalList` composes:

- **Brain via host directive** - `CngxPaginate` supplies `cumulativeRange()` /
  `isLast()` / `isBusy()`; the organism holds no accumulation state of its own.
- **Async view switch** - `resolveAsyncView(status, isFirstLoad, isEmpty)` maps
  the single `[state]` source onto the rendered region.
- **Projected trigger** - a `<ng-content>` region backed by
  `CNGX_PAGINATOR_HOST`, accepting the load-more / infinite atoms or a custom
  trigger.

## Material Theme

Include the theme SCSS in your global stylesheet so the organism's tokens adopt
the Material system palette:

```scss
@use '@angular/material' as mat;
@use '@cngx/themes/material/incremental-list-theme' as incremental-list;

$theme: mat.define-theme((...));

html {
  @include mat.all-component-themes($theme);
  @include incremental-list.theme($theme);
}
```

Without the bridge the organism uses the cngx foundation `--cngx-color-*` tokens
(light/dark aware) with a native look; the bridge maps text, dividers, surface,
error, and the retry button onto `--mat-sys-*`.

## See Also

- [CngxAsyncState](../../core/utils/) - async state contract
- [CngxPaginate](../../common/data/paginate/) - the pagination brain
- [API on compodocx](https://cngxjs.github.io/cngx/)
- Tests: `projects/ui/collection/incremental-list.component.spec.ts`
