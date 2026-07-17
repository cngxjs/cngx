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
