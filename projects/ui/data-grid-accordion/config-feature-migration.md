# Migration - `CngxDataGridAccordionConfigFeature` is a union type

`CngxDataGridAccordionConfigFeature` used to be an `interface` with a single
`kind: 'skin'` member. `withDataGridAccordionLabels(...)` adds a second
feature, so the type is now a discriminated union:

```ts
type CngxDataGridAccordionConfigFeature =
  | { readonly kind: 'skin'; readonly payload: { readonly skin: CngxDataGridSkin } }
  | { readonly kind: 'labels'; readonly payload: { readonly labels: /* ... */ } };
```

## Who is affected

Nobody who only calls `withDataGridSkin(...)` / `withDataGridAccordionLabels(...)`
and passes the result to `provideDataGridAccordionConfig(...)` or
`provideDataGridAccordionConfigAt(...)`. That code compiles unchanged.

Two uses of the old `interface` stop compiling:

- **`extends`** - `interface MyFeature extends CngxDataGridAccordionConfigFeature`.
  An interface cannot extend a union. Use an intersection with the member you
  mean: `type MyFeature = Extract<CngxDataGridAccordionConfigFeature, { kind: 'skin' }> & { ... }`.
- **Declaration merging** - a `declare module '@cngx/ui/data-grid-accordion'`
  block that re-opens `interface CngxDataGridAccordionConfigFeature`. A type
  alias cannot be merged. There is no replacement: the reducer only understands
  the `kind`s the library ships, so a merged member was never applied.

Code that reads `feature.payload.skin` without checking `kind` first now needs
the check, because the `labels` member has no `skin`:

```ts
if (feature.kind === 'skin') {
  use(feature.payload.skin);
}
```
