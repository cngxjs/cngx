# Filter Chips

Bridge component that surfaces the active values of a multi-select filter dimension as a chip strip. `CngxFilterChips` wraps `<cngx-multi-chip-group>`, registers a single named predicate on a parent `CngxFilter`, and lets chip toggles drive the filter via Pillar-1 derivation. No `effect()` write-back, no manual sync, multi-select only.

## Import

```ts
import { CngxFilterChips, CngxFilterChip } from '@cngx/common/data';
```

## Quick start

```html
<ng-container [cngxFilter]="null" #filter="cngxFilter">
  <cngx-filter-chips
    label="Tags"
    [options]="tagOptions"
    [optionLabel]="tagLabel"
    [optionValue]="tagId"
    [filterRef]="filter"
    filterKey="tags"
  />

  @for (item of visibleItems(filter.predicate()); track tagId(item)) {
    <article>{{ item.label }}</article>
  }
</ng-container>
```

`label`, `options`, `optionLabel`, `optionValue`, `filterRef`, and `filterKey` are required. Each toggled chip updates `selectedValues`; the registered predicate reads `selectedValues()` lazily so downstream filtered lists recompute through `filter.predicate()` without the bridge touching them.

## Composition with `CngxFilter` and `CngxSearch`

`CngxFilterChips` is one dimension. Stack as many as needed under a single `CngxFilter` host - the directive AND-combines every named predicate:

```html
<ng-container [cngxFilter]="null" #filter="cngxFilter">
  <input cngxSearch [filterRef]="filter" filterKey="search" [searchIn]="['name']" />

  <cngx-filter-chips
    label="Role"
    filterKey="role"
    [filterRef]="filter"
    [options]="roleOptions"
    [optionLabel]="roleLabel"
    [optionValue]="roleId"
  />

  <cngx-filter-chips
    label="Location"
    filterKey="location"
    [filterRef]="filter"
    [options]="locationOptions"
    [optionLabel]="locationLabel"
    [optionValue]="locationId"
  />

  @for (emp of filteredEmployees(); track emp.id) { ... }
</ng-container>
```

Each chip strip owns a distinct `filterKey`. An employee must pass `search` AND `role` AND `location` to appear. OR within one dimension stays inside the predicate - the bridge already does this: an empty `selectedValues` short-circuits to `true`, a non-empty selection ORs across the picked values.

A single-select filter-chip pattern is intentionally out of scope per the select-family split. Consumers needing single-select wire `<cngx-chip-group>` to a custom predicate themselves.

### Custom chip decoration

Project an `<ng-template cngxFilterChip>` to override the chip body. The bridge keeps owning the `cngxChipInGroup` wrapper - the slot only customises what renders inside:

```html
<cngx-filter-chips
  label="Tags"
  [options]="tagOptions"
  [optionLabel]="tagLabel"
  [optionValue]="tagId"
  [filterRef]="filter"
  filterKey="tags"
>
  <ng-template cngxFilterChip let-option let-label="label">
    <cngx-icon><mat-icon>label</mat-icon></cngx-icon>
    {{ label }}
  </ng-template>
</cngx-filter-chips>
```

The slot context carries `$implicit`, `option`, `value`, and `label`. Selection wiring is not redeclared - projecting a `cngxChipInGroup` from consumer scope would fail to resolve the inner chip-group host injector.

### Object-valued options

When `TValue` is an object, pass `keyFn` to extract a stable identity key. The bridge uses it both for chip-group membership and inside the predicate's `Object.is` comparison, so chip state survives re-emissions with fresh references.

```html
<cngx-filter-chips
  label="Owners"
  [options]="owners"
  [optionLabel]="ownerLabel"
  [optionValue]="ownerRef"
  [keyFn]="ownerKey"
  [filterRef]="filter"
  filterKey="owner"
/>
```

## Accessibility

The chip strip inherits the ARIA shape of `<cngx-multi-chip-group>`: a labelled `role="listbox"` with `aria-multiselectable="true"`, roving tabindex, and toggle-state-on-chip semantics. `label` is the required group name and is surfaced to AT.

Form-state surface (`disabled`, `required`, `invalid`, `errorMessageId`) is forwarded transparently to the inner group, so a chip strip wired into a form participates in the same `aria-invalid` / `aria-describedby` graph as any other CNGX control.

`CngxFilterChips` does not own a result-count live region. Announcing the change is the consumer's job - a `role="status" aria-live="polite"` sibling that reads `filter.predicate()`-filtered length is the canonical pattern:

```html
<p role="status" aria-live="polite">
  Showing {{ visibleItems(filter.predicate()).length }} of {{ items.length }}
</p>
```

This keeps the chip strip and the announcement decoupled: the same `CngxFilter` predicate drives both the rendered list and the live region from one source.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs, slot context, and tokens.
- `@cngx/common/data/filter` - the `CngxFilter` predicate host this bridge registers against.
- `CngxChip` (`@cngx/common/display`) - the visual atom each chip wrapper composes.
- Stories: `examples/stories/common/data/filter-chips/`.
