# @cngx/ui/paginator

Default-theme, skinnable, framework-neutral pagination organism. A declarative
`<cngx-paginator>` shell over the `CngxPaginate` brain from `@cngx/common/data`,
assembled from projected segment parts in DOM order - no `show*` config inputs.

## When you reach for it

You want a paginator that:

- Composes from child parts (`cngx-pgn-prev`, `cngx-pgn-pages`,
  `cngx-pgn-page-size`, `cngx-pgn-range`, `cngx-pgn-goto`, ...) instead of a pile
  of boolean inputs.
- Repaints across seven skins via a single `[skin]` attribute, with identical
  DOM, ARIA, and keyboard behaviour across all of them.
- Carries async-aware navigation gating, a roving-keyboard page row, and
  live-region announcements out of the box.
- Ships no Material runtime.

If you already render a Material `<mat-paginator>`, reach for `[cngxMatPaginator]`
in `@cngx/ui/mat-paginator` instead. The `CngxPaginate` brain is shared.

## Usage

The shell exposes only `total`, `[(pageIndex)]`, `[(pageSize)]`, `[state]`,
`skin`, `density`, and `resetOn`. Everything else is a projected segment in DOM
order. The brain owns no data: bind `[total]`, read the active page back through
the two-way bindings, and slice your own array.

```html
<cngx-paginator skin="numbered" [total]="items().length" [(pageIndex)]="pageIndex">
  <cngx-pgn-prev />
  <cngx-pgn-pages />
  <cngx-pgn-next />
  <cngx-pgn-range />
</cngx-paginator>
```

```ts
protected readonly pageIndex = signal(0);
protected readonly pageSize = signal(10);
protected readonly pageItems = computed(() => {
  const start = this.pageIndex() * this.pageSize();
  return this.items().slice(start, start + this.pageSize());
});
```

## Segments

Each part injects `CNGX_PAGINATOR_HOST` and self-wires; drop in only what the
context needs.

|Segment|Selector|Role|
|-|-|-|
|First / last|`cngx-pgn-first` / `cngx-pgn-last`|Jump to the boundaries; `aria-disabled` at the bound|
|Previous / next|`cngx-pgn-prev` / `cngx-pgn-next`|Step one page; `aria-disabled` at the bound|
|Pages|`cngx-pgn-pages`|Roving numbered row with ellipsis overflow menu, `aria-current` on the active page|
|Range|`cngx-pgn-range`|`start-end of total` readout (format from config)|
|Page size|`cngx-pgn-page-size`|`CngxListbox` select; `[options]` is data (falls back to the `withPaginatorPageSizeOptions` cascade default); resets to the first page|
|Page of pages|`cngx-pgn-page-of-pages`|`current / total` jump dropdown|
|Go to|`cngx-pgn-goto`|Native number input; Enter or blur navigates|
|Dots|`cngx-pgn-dots`|One dot per page (organism-internal), for the `dots` skin|

## Skins

`numbered`, `minimal`, `pill`, `segmented`, `rail`, `dots`, `bar`. Set via
`[skin]` -> `[data-skin]`. Skin is paint-only: DOM, ARIA, and keyboard behaviour
are identical across all seven. `density` (`compact` / `default` / `comfortable`)
is orthogonal.

## Reset and deep-linking

`[resetOn]` jumps to the first page whenever its bound value changes - bind the
sort / filter / search value the result set depends on so a narrowed result never
strands the user on a now-empty page. Mounting does not reset; bind a primitive
or a `computed`, never an inline literal.

```html
<cngx-paginator [total]="filtered().length" [resetOn]="search()">…</cngx-paginator>
```

For deep-linkable, back-button-safe URLs add the brain-level
`[cngxPaginateRouting]` directive (from `@cngx/common/data`) on the same host - it
persists the page / size in the query string and needs `@angular/router`.

```html
<cngx-paginator cngxPaginateRouting [total]="items().length">…</cngx-paginator>
```

## Async

`CngxPaginator` is an async-state consumer. Bind `[state]` and, while busy, it
gates navigation, renders an indeterminate `cngx-progress` bar, flips
`aria-busy`, and announces the transition.

```html
<cngx-paginator [total]="total()" [state]="loading">…</cngx-paginator>
```

## Configuration

All accessible-name strings, announcement phrasing, the range format, and the
default page-size choices cascade through `CNGX_PAGINATOR_CONFIG` (English
defaults). Override at the app root with `provideCngxPaginatorConfig(...)`, or
per region with `provideCngxPaginatorConfigAt(...)` in `viewProviders`.

```ts
provideCngxPaginatorConfig(
  withPaginatorAriaLabels({ next: 'Nächste Seite', pageOfPages: 'Seite wählen' }),
  withPaginatorAnnouncements({ pageChange: (p, t) => `Seite ${p} von ${t}` }),
  withPaginatorRangeFormat((start, end, total) => `${start}-${end} von ${total}`),
  withPaginatorPageSizeOptions([12, 24, 48]),
);
```

`withPaginatorRangeFormat` localises the `cngx-pgn-range` text (including the
`of` connector); `ariaLabels.pageOfPages` is the dedicated label for the
page-of-pages selector. `withPaginatorPageSizeOptions` sets the default
`cngx-pgn-page-size` choices, so the dropdown needs no per-instance `[options]`;
a non-empty `[options]` binding still wins over the cascade default.

The live-region announcer is swappable. `CNGX_PAGINATOR_ANNOUNCER_FACTORY`
defaults to `createPaginatorAnnouncer`; override it to wrap the busy / settle /
page-change derivation (telemetry tap, politeness escalation, custom branching)
without forking the shell. It mirrors the select family's
`CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY`.

## Accessibility

`role="navigation"` landmark with a configurable `aria-label`; a single
roving tab stop on the page row (arrows / Home / End); `aria-current="page"` on
the active page; a single computed `aria-busy` owner; live-region page-change,
clamp, and async announcements. A `total`-shrink clamp is never silent - the
clamped page is both emitted back to the consumer and announced.
