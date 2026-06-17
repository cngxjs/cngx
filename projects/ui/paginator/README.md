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

> Full API, skins, and segment reference land with the stories in the docs pass.
