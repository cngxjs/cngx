# Tag Group

Layout container for a row of `CngxTag` siblings. Owns flex-wrap layout (`gap`, `align`), an opt-in `role="list"` cascade that flips every projected tag to `role="listitem"`, and two `<ng-template>`-driven slot zones above and below the row. Decorative by default, semantic on demand. The list-role cascade is implemented on the `CngxTag` side reading `CNGX_TAG_GROUP.semanticList()` so any host implementing `CngxTagGroupHost` participates.

## Import

```ts
import {
  CngxTagGroup,
  CngxTagGroupHeader,
  CngxTagGroupAccessory,
} from '@cngx/common/display';
```

## Quick start

```html
<!-- Decorative: flex-wrap layout, no ARIA semantics -->
<cngx-tag-group>
  <span cngxTag color="info">Frontend</span>
  <span cngxTag color="info">Backend</span>
  <span cngxTag color="success">Cleared</span>
</cngx-tag-group>

<!-- Semantic list: AT reads "Filters, list, 3 items" -->
<cngx-tag-group [semanticList]="true" label="Filters">
  <span cngxTag color="info">Frontend</span>
  <span cngxTag color="info">Backend</span>
  <span cngxTag color="warning">Pending</span>
</cngx-tag-group>

<!-- Header and accessory slots with reactive count -->
<cngx-tag-group [semanticList]="true" label="Active filters">
  <ng-template cngxTagGroupHeader let-count="count">
    <strong>Filters ({{ count }})</strong>
  </ng-template>
  @for (f of filters(); track f.label) {
    <span cngxTag [color]="f.color">{{ f.label }}</span>
  }
  <ng-template cngxTagGroupAccessory let-count="count">
    <button type="button" (click)="clearAll()" [disabled]="count === 0">
      Clear all ({{ count }})
    </button>
  </ng-template>
</cngx-tag-group>
```

## Gap and alignment

| Input | Values | Default | Effect |
|-|-|-|-|
| `gap` | `xs` \| `sm` \| `md` | `sm` | Horizontal spacing between tags. Maps to `--cngx-tag-group-gap{,-xs,-md}` |
| `align` | `start` \| `center` \| `end` \| `between` | `start` | Cross-axis distribution. Resolves to `justify-content: flex-start` / `center` / `flex-end` / `space-between` |

`align` is only meaningful when the group has more horizontal room than its intrinsic content; otherwise the row hugs its tags.

Both defaults can be overridden app-wide through `provideTagConfig({ groupDefaults: { gap: 'md', align: 'center', semanticList: true } })`.

## Semantic vs presentational

Two modes, one input.

| `semanticList` | Host ARIA | Tag role |
|-|-|-|
| `false` (default) | none (and `aria-label` set only if `label` is provided) | unset |
| `true` | `role="list"`, `aria-label="<label>"` | `role="listitem"` on every projected `CngxTag` |

The list-role cascade reaches the children via `CNGX_TAG_GROUP`. `CngxTag` injects the token `{ optional: true }` and derives its own role from `host.semanticList()` in a `computed()`. Outside any group the token resolves to `null` and the role attribute stays unset.

Setting `label` without `semanticList="true"` lands the `aria-label` on a generic `<div>` (no role). AT exposes the label but does not surface "list, N items". A dev-mode `afterNextRender` check logs a one-shot warning in this case and is tree-shaken in production.

## Slots

Two `ng-template` slots, projected above and below the tag row. Default body is empty - when not projected, no DOM is rendered for that zone.

| Slot | Directive | Position | Context type |
|-|-|-|-|
| Header | `*cngxTagGroupHeader` | Above row | `CngxTagGroupHeaderContext` |
| Accessory | `*cngxTagGroupAccessory` | Below row | `CngxTagGroupAccessoryContext` |

Both context interfaces are structurally identical and expose the live group state plus `count` of projected `CngxTag` direct children:

```ts
interface CngxTagGroupHeaderContext {
  readonly $implicit: void;
  readonly gap: CngxTagGroupGap;
  readonly align: CngxTagGroupAlign;
  readonly semanticList: boolean;
  readonly label: string | undefined;
  readonly count: number;
}
```

`count` is scoped to direct `<span cngxTag>` children of the group; tags nested inside the consumer-projected header or accessory templates do not inflate it.

## Accessibility

- `role="list"` is set on the host only when `semanticList()` is `true`. The attribute is `null` otherwise so the host stays decorative.
- `aria-label` mirrors `label()` directly. Bind it without `semanticList="true"` and dev-mode logs an advisory.
- The `role="listitem"` cascade lives on `CngxTag`, derived reactively from `CNGX_TAG_GROUP.semanticList()`. The role flips at runtime when `semanticList` toggles - no manual sync.
- Both attributes are wired through `computed()` reads, not imperative DOM writes.

## Token contract

`CNGX_TAG_GROUP: InjectionToken<CngxTagGroupHost>` is provided by every `CngxTagGroup` instance via `useExisting`. The contract is intentionally minimal:

```ts
interface CngxTagGroupHost {
  readonly semanticList: Signal<boolean>;
}
```

Test doubles and programmatic groups can satisfy `CngxTagGroupHost` without owning an Angular `input()` - the contract is typed `Signal<boolean>`, not `InputSignal<boolean>`.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs, slots, and the token contract.
- Stories: `examples/stories/common/display/tag/` (`group-semantic-list`, `group-with-header-accessory`, `layout-only-alignment`, `layout-only-gap-variants`).
- `CngxTag` - the child the cascade targets. Reads `CNGX_TAG_GROUP` to derive `role="listitem"`.
