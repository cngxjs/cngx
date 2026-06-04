# Tag Group Slots

Two `<ng-template>` slot directives that hand consumers the header and accessory zones of `<cngx-tag-group>`. Both have empty defaults - when no template is projected, no DOM is rendered for that zone. Each slot exposes the full reactive group state plus a live `count` of direct `<span cngxTag>` children, so patterns like `Filters ({{ count }})` or `Clear all ({{ count }})` work without injecting the group. The parent [tag-group/README.md](../README.md) has the high-level slots table; this file is the per-slot reference.

## Import

```ts
import {
  CngxTagGroupHeader,
  CngxTagGroupAccessory,
  type CngxTagGroupHeaderContext,
  type CngxTagGroupAccessoryContext,
} from '@cngx/common/display';
```

## Slots

| Slot | Directive | Selector | Position | Context type |
|-|-|-|-|-|
| Header | `CngxTagGroupHeader` | `ng-template[cngxTagGroupHeader]` | Above the tag row | `CngxTagGroupHeaderContext` |
| Accessory | `CngxTagGroupAccessory` | `ng-template[cngxTagGroupAccessory]` | Below the tag row | `CngxTagGroupAccessoryContext` |

## Context

Both context interfaces are structurally identical today. They are kept as separate exported names so future per-slot fields (header-only dropdown density, accessory-only position) can land without breaking sibling consumers.

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

`$implicit` is `void` because the slot carries no positional payload. Reach for the named fields. `count` is scoped to direct `<span cngxTag>` children of the group - tags nested inside the projected slot templates themselves do not inflate it.

## Quick start

```html
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

Both slots are independent - project one, both, or neither.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for the slot directives and context interfaces.
- `CngxTagGroup` - the host that drives the slot context and the `semanticList` cascade. See [tag-group/README.md](../README.md).
- `CngxTag` - the child whose count populates `context.count`.
