# Tag

Display atom for static classification: status indicators on list rows, taxonomy badges on cards, role markers in admin tables, pre-filter chips in a sidebar. `CngxTag` is applied and stays put. For a removable, ephemeral pill (chip strip, multi-select tokens) reach for `CngxChip` instead. Two narrow atoms with non-overlapping concerns beat one hybrid with mode flags.

Directive with a dual selector (`[cngxTag]`, `cngx-tag`), three template slots (`*cngxTagLabel`, `*cngxTagPrefix`, `*cngxTagSuffix`), and a config cascade (`provideTagConfig` / `provideTagConfigAt`) so apps set defaults once. The directive never injects routing or click semantics: `<a cngxTag href="…">` keeps native anchor behaviour, `<button cngxTag>` keeps native button behaviour. The visual contract drops onto whichever host carries the right semantics.

## Import

```ts
import {
  CngxTag,
  CngxTagLabel,
  CngxTagPrefix,
  CngxTagSuffix,
} from '@cngx/common/display';
```

## Quick start

```html
<!-- Plain static label -->
<span cngxTag color="success">Cleared</span>

<!-- Prefix slot for a status glyph -->
<span cngxTag color="warning">
  <ng-template cngxTagPrefix>
    <cngx-icon size="sm" aria-hidden="true">
      <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="4" fill="currentColor"/></svg>
    </cngx-icon>
  </ng-template>
  Pending review
</span>

<!-- Link mode: real anchor, native focus + keyboard -->
<a cngxTag color="info" href="#category/frontend">frontend</a>

<!-- Outline variant, small density, hard width cap -->
<span cngxTag variant="outline" size="sm" [truncate]="true" maxWidth="8rem">
  Authentication failure on edge node
</span>
```

## Selector duality

Two selectors, one directive:

- `cngx-tag` as element: a clean wrapper around projected content.
- `[cngxTag]` as attribute: promote any host (`<span>`, `<a>`, `<button>`, `<div>`) without adding wrapper DOM. Anchor and button semantics survive.

Pick by the semantics of the host. The directive does not synthesise click or keyboard handling. If the tag needs to navigate, render an anchor. If it needs to fire an action, render a button.

## Variants

`variant` is `CngxTagVariant`. Pinned via host class.

| Value | Surface |
|-|-|
| `filled` (default) | Solid tinted background per `[data-color]` |
| `outline` | Transparent fill, colored 1px stroke |
| `subtle` | Softer tinted fill, transparent border |

## Colors

`color` is `CngxTagColor`: five predefined semantic keys plus any consumer string. The directive emits the value verbatim as `data-color`, so consumer styles author against `[data-color="my-brand"]` selectors.

| Key | Token family |
|-|-|
| `neutral` (default) | `--cngx-tag-neutral-{bg,color,border,subtle-bg}` |
| `success` | `--cngx-tag-success-*`, falls back to `--cngx-color-success` |
| `warning` | `--cngx-tag-warning-*`, falls back to `--cngx-color-warning` |
| `error` | `--cngx-tag-error-*`, falls back to `--cngx-color-danger` |
| `info` | `--cngx-tag-info-*`, falls back to `--cngx-color-info` |
| `(string & {})` | Any consumer key, emitted as `data-color="<key>"` |

Consumer keys register through `withTagColors({ 'my-brand': { bg, color, border } })` (see below). The five predefined keys ship in `tag.css` and are not part of that map.

## Sizes

`size` is `CngxTagSize` (default `md`). Each step retargets `--cngx-tag-{sm|lg|xl}-padding` and the matching font-size variable.

| Value | Padding | Font size |
|-|-|-|
| `sm` | `0 6px` | `0.6875rem` |
| `md` (default) | `2px 8px` | `0.75rem` |
| `lg` | `4px 10px` | `0.875rem` |
| `xl` | `6px 12px` | `1rem` |

Sizing of nested atoms (`cngx-icon`, `cngx-avatar`) is the consumer's call. Tag does not cascade a sub-token contract.

## Truncate + maxWidth

`truncate` toggles `text-overflow: ellipsis` + `white-space: nowrap` on the inner `.cngx-tag__label` span. `maxWidth` binds inline (`'12rem'`, `'200px'`, `null` to clear). The full text stays in the DOM for AT. For multi-line clamp + expand/collapse use `CngxTruncate` from `@cngx/common/layout` instead.

Projecting `*cngxTagLabel` drops the default `.cngx-tag__label` wrapper, which means the consumer template owns the overflow strategy on that instance.

## Slots

Three positional slots. Order on screen is prefix > label > suffix. Each slot's context object exposes the live reactive state so templates can branch on variant / color / size / truncate without injecting the directive.

| Selector | Replaces | Context type |
|-|-|-|
| `*cngxTagLabel` | The default `<span class="cngx-tag__label"><ng-content/></span>` wrapper. Replacing this drops the built-in ellipsis hook. | `CngxTagLabelContext` |
| `*cngxTagPrefix` | Empty slot before the label. No DOM rendered when omitted. | `CngxTagPrefixContext` |
| `*cngxTagSuffix` | Empty slot after the label. No DOM rendered when omitted. Removable affordances belong on `CngxChip`, not as a suffix. | `CngxTagSuffixContext` |

The three context interfaces are structurally identical in this release (`$implicit: void`, `variant`, `color`, `size`, `truncate`). They stay separate so future per-slot fields can land without breaking sibling consumers.

```html
<span cngxTag color="success">
  <ng-template cngxTagLabel let-color="color">
    <bdi>{{ user.name }} ({{ color }})</bdi>
  </ng-template>
</span>
```

## App-wide defaults

The cascade resolves in priority order:

1. Per-instance Input binding (`[variant]="'subtle'"`).
2. `provideTagConfigAt(...)` in a parent component's `viewProviders` (sub-tree scope, deep-merges with the parent value).
3. `provideTagConfig(...)` at `bootstrapApplication` (root scope).
4. Library defaults (English; `filled` / `neutral` / `md`).

Four feature factories compose. Each writes one sub-tree of `CngxTagConfig`:

| Factory | Writes |
|-|-|
| `withTagDefaults` | `defaults.{variant,color,size,truncate,maxWidth}` for `CngxTag` |
| `withTagGroupDefaults` | `groupDefaults.{gap,align,semanticList}` for `CngxTagGroup` |
| `withTagColors` | `colors[<key>] = { bg, color, border }`, consumer palette entries |
| `withTagSlots` | `templates.{label,prefix,suffix,header,accessory}`, app-wide slot overrides |

```ts
bootstrapApplication(AppComponent, {
  providers: [
    provideTagConfig(
      withTagDefaults({ variant: 'subtle', size: 'sm' }),
      withTagGroupDefaults({ gap: 'md', semanticList: true }),
      withTagColors({
        'my-brand': {
          bg: 'var(--cngx-color-primary)',
          color: 'var(--cngx-color-on-primary)',
          border: 'transparent',
        },
      }),
    ),
  ],
});
```

For a sub-tree override (admin section runs compact, the rest of the app keeps the root default), put `provideTagConfigAt(...)` in `viewProviders`. The factory injects the parent's `CNGX_TAG_CONFIG` with `skipSelf` and deep-merges, so cascades stack cleanly.

`injectTagConfig()` resolves the current config inside any injection context. Useful from a sibling directive that wants the same fallback defaults.

## Accessibility

The directive sets one ARIA attribute and only when relevant.

| Context | Host attribute |
|-|-|
| Projected inside `<cngx-tag-group [semanticList]="true">` | `role="listitem"`, reactive: drops to `null` when `semanticList()` flips off |
| Standalone, or group with `semanticList=false` | No synthetic role. `<a cngxTag>` keeps native `role="link"`, `<button cngxTag>` keeps `role="button"`, `<span cngxTag>` carries no role |

There is no `aria-label`, `aria-describedby`, or live-region wiring on the host. The tag's accessible name is its text content. Decorative glyphs in `*cngxTagPrefix` / `*cngxTagSuffix` should carry `aria-hidden="true"` so they do not pollute that name.

## Composition with CngxTagGroup

`CngxTagGroup` is the layout container. It owns the flex row, gap, alignment, and the optional `role="list"` semantics. Tags project as children and read the group's state through the `CNGX_TAG_GROUP` token without consumer wiring.

```html
<cngx-tag-group [semanticList]="true" label="Filters">
  <span cngxTag color="info">Frontend</span>
  <span cngxTag color="success">Cleared</span>
  <span cngxTag color="warning">Pending</span>
</cngx-tag-group>
```

AT reads "Filters, list, 3 items". Drop `[semanticList]` and the group is layout-only: every tag keeps its native role.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs, types, and tokens.
- Stories: `examples/stories/common/display/tag/`.
- `CngxTagGroup`: layout container plus optional `role="list"` semantics.
- `CngxChip`: removable, ephemeral counterpart with its own remove button and announcer.
- `CngxIcon`: the glyph atom used in prefix / suffix slots.
