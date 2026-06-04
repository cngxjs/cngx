# Tag Slots

Three positional template directives that override the inner regions of `<span cngxTag>`. Each is a structural `ng-template` selector with no behavior of its own: the host directive (`CngxTag`) detects the projection and swaps the default body for the consumer template. Order on screen is prefix > label > suffix. For the high-level overview see [the Tag README](../README.md#slots).

## Import

```ts
import {
  CngxTagLabel,
  CngxTagPrefix,
  CngxTagSuffix,
} from '@cngx/common/display';
```

## Directives

| Selector | Class | Replaces | Context type |
|-|-|-|-|
| `*cngxTagLabel` | `CngxTagLabel` | Default `<span class="cngx-tag__label"><ng-content/></span>`. Replacing it drops the built-in ellipsis hook. | `CngxTagLabelContext` |
| `*cngxTagPrefix` | `CngxTagPrefix` | Empty slot before the label. No DOM when omitted. | `CngxTagPrefixContext` |
| `*cngxTagSuffix` | `CngxTagSuffix` | Empty slot after the label. No DOM when omitted. Removable affordances belong on `CngxChip`. | `CngxTagSuffixContext` |

## Context shape

The three context interfaces are structurally identical in this release. They stay separate so future per-slot fields (e.g. spacing tokens on prefix, sort-direction on suffix) can land without breaking sibling consumers.

| Field | Type | Notes |
|-|-|-|
| `$implicit` | `void` | No positional payload. Reach for the named fields. |
| `variant` | `CngxTagVariant` | `filled` / `outline` / `subtle` |
| `color` | `CngxTagColor` | The five predefined keys plus any consumer string |
| `size` | `CngxTagSize` | `sm` / `md` / `lg` / `xl` |
| `truncate` | `boolean` | Reflects the `[truncate]` input on the host |

## Quick start

### Label override

Drop the default `.cngx-tag__label` wrapper to take ownership of the inner element. The ellipsis hook goes with it: the consumer template owns the overflow strategy.

```html
<span cngxTag color="success">
  <ng-template cngxTagLabel let-color="color">
    <bdi>{{ user.name }} ({{ color }})</bdi>
  </ng-template>
</span>
```

### Prefix slot

Status glyph before the label. Decorative glyphs carry `aria-hidden="true"` so they do not pollute the tag's accessible name.

```html
<span cngxTag color="warning">
  <ng-template cngxTagPrefix>
    <cngx-icon size="sm" aria-hidden="true">
      <svg viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="4" fill="currentColor" />
      </svg>
    </cngx-icon>
  </ng-template>
  Pending review
</span>
```

### Suffix slot

Trailing chevron or sort indicator. Reading the context lets the template branch without re-injecting the host.

```html
<span cngxTag color="info">
  Filter
  <ng-template cngxTagSuffix let-size="size">
    <cngx-icon [size]="size" aria-hidden="true">
      <svg viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" /></svg>
    </cngx-icon>
  </ng-template>
</span>
```

### All three at once

```html
<span cngxTag color="my-brand" variant="subtle">
  <ng-template cngxTagPrefix>
    <cngx-icon size="sm" aria-hidden="true"><i class="fa-solid fa-tag"></i></cngx-icon>
  </ng-template>
  <ng-template cngxTagLabel>
    <bdi>{{ ticket.title }}</bdi>
  </ng-template>
  <ng-template cngxTagSuffix>
    <span>#{{ ticket.id }}</span>
  </ng-template>
</span>
```

## App-wide slot defaults

For an app-wide override use `withTagSlots(...)` inside `provideTagConfig(...)` instead of repeating the `ng-template` block on every call site. The config cascade resolves per-instance projection first, then `provideTagConfigAt` in `viewProviders`, then `provideTagConfig` at bootstrap. See [the Tag README](../README.md#app-wide-defaults).

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for the directive classes, selectors, and context interfaces.
- [`CngxTag`](../README.md): the host directive that consumes these slots.
- [`CngxTagGroup`](../../tag-group/README.md): layout container with its own header / accessory slots.
- Stories: `examples/stories/common/display/tag/slot-overrides-*`.
