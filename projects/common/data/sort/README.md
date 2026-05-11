# Sort

Multi-column sorting with single-sort and additive (Shift+click) modes. Track sort state via signals, apply sorting in a `computed()`.

## Import

```typescript
import {
  CngxSort,
  CngxSortHeader,
  type SortEntry,
} from '@cngx/common/data';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxSort, CngxSortHeader } from '@cngx/common/data';

@Component({
  selector: 'app-table',
  template: `
    <div [cngxSort]="true" #sort="cngxSort">
      <table>
        <thead>
          <tr>
            <th>
              <button cngxSortHeader="name" [cngxSortRef]="sort" #nameCol="cngxSortHeader">
                Name {{ nameCol.isAsc() ? '↑' : '↓' }}
              </button>
            </th>
            <th>
              <button cngxSortHeader="age" [cngxSortRef]="sort" #ageCol="cngxSortHeader">
                Age {{ ageCol.isAsc() ? '↑' : '↓' }}
              </button>
            </th>
          </tr>
        </thead>
      </table>
    </div>
  `,
  imports: [CngxSort, CngxSortHeader],
})
export class TableComponent {}
```

## CngxSort — Sort State Atom

Tracks the active sort field and direction. Supports both single-sort and multi-sort (Shift+click) modes. Nothing is injected automatically — consumer explicitly wires headers via `[cngxSortRef]`.

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `cngxSortActive` | `string \| undefined` | `undefined` | **Controlled** active field (single-sort only). Takes precedence over internal state. |
| `cngxSortDirection` | `'asc' \| 'desc' \| undefined` | `undefined` | **Controlled** sort direction (single-sort only). Pair with `sortChange` to keep in sync. |
| `multiSort` | `boolean` | `false` | When `true`, Shift+click on a header adds it to the sort stack instead of replacing. |

### Outputs

| Output | Emits | Description |
|-|-|-|
| `sortChange` | `SortEntry \| undefined` | Emitted when the primary sort changes. Emits `undefined` when cleared. |
| `sortsChange` | `SortEntry[]` | Emitted whenever the sort stack changes (includes full clears). Always the complete array at time of emission. |

### Signals

| Signal | Type | Description |
|-|-|-|
| `active()` | `string \| undefined` | Active field of the primary sort entry (controlled takes precedence). |
| `direction()` | `'asc' \| 'desc' \| undefined` | Direction of the primary sort (controlled takes precedence). |
| `sort()` | `SortEntry \| null` | Primary sort as `{ active, direction }` or `null` if none active. |
| `sorts()` | `SortEntry[]` | All active sorts in priority order. Multi-sort stack. |
| `isActive()` | `boolean` | `true` when at least one sort is active. |

### Methods

#### `setSort(field: string, additive?: boolean): void`

Apply sort to a field.

**`additive = false`** (plain click, default):
- Same field → cycle direction: asc → desc → asc
- Different field → replace entire stack with `{ field, 'asc' }`

**`additive = true`** (Shift+click when `multiSort` enabled):
- Field not in stack → append as asc
- Field in stack as asc → change to desc
- Field in stack as desc → remove from stack

**Example:**

```typescript
// Primary sort: age ascending
this.sort.setSort('age', false);

// Add name as secondary: shift+click
this.sort.setSort('name', true);
// sorts() = [{ active: 'age', direction: 'asc' }, { active: 'name', direction: 'asc' }]

// Toggle age to desc
this.sort.setSort('age', false);
// sorts() = [{ active: 'age', direction: 'desc' }]
```

#### `clear(): void`

Remove all sorts. Emits both `sortChange(undefined)` and `sortsChange([])`.

```typescript
this.sort.clear();
// sort.sort() is now null
```

## CngxSortHeader — Sort Header Molecule

Apply to clickable header elements. Consumer provides explicit `[cngxSortRef]` — no ancestor injection, no hidden wiring.

Supports multi-sort: Shift+click adds column to stack (when `multiSort` enabled on owning `CngxSort`). Shows `priority()` badge for visual sort-order indication.

### Inputs

| Input | Type | Required | Description |
|-|-|-|-|
| `cngxSortHeader` | `string` | Yes | The field key this header represents. |
| `cngxSortRef` | `CngxSort` | Yes | Explicit reference to the owning `CngxSort` directive. |

### Signals

| Signal | Type | Description |
|-|-|-|
| `isActive()` | `boolean` | `true` when this column is part of the active sort (primary or secondary). |
| `isAsc()` | `boolean` | `true` when active and direction is ascending. |
| `isDesc()` | `boolean` | `true` when active and direction is descending. |
| `priority()` | `number` | 1-based position in the sort stack (0 when not active). Only meaningful in multi-sort mode. |
| `ariaSort()` | `'ascending' \| 'descending' \| null` | ARIA attribute value for screen readers. |

### Host Classes

- `.cngx-sort-header--active` — applied when column is in the active sort
- `.cngx-sort-header--asc` — applied when active and ascending
- `.cngx-sort-header--desc` — applied when active and descending

### ARIA Attributes

- `aria-sort` — auto-set to `'ascending'`, `'descending'`, or removed based on sort state

**Example:**

```html
<button cngxSortHeader="name" [cngxSortRef]="sort" #nameCol="cngxSortHeader">
  Name
  @if (nameCol.isActive()) {
    {{ nameCol.isAsc() ? '↑' : '↓' }}
    @if (sort.multiSort()) {
      <span class="sort-priority">{{ nameCol.priority() }}</span>
    }
  }
</button>
```

## Controlled vs Uncontrolled

### Uncontrolled (Default)

Internal state fully managed by the directive:

```typescript
<div [cngxSort]="true" #sort="cngxSort">
  <button cngxSortHeader="name" [cngxSortRef]="sort">Name</button>
</div>

// User clicks Name → sort.sort() changes
// sort.setSort('name') called by the button handler
```

### Controlled

Parent component drives the sort state via inputs:

```typescript
readonly sortActive = signal<string | undefined>();
readonly sortDirection = signal<'asc' | 'desc' | undefined>();

<div
  [cngxSort]="true"
  [cngxSortActive]="sortActive()"
  [cngxSortDirection]="sortDirection()"
  (sortChange)="handleSortChange($event)"
  #sort="cngxSort"
>
  <button cngxSortHeader="name" [cngxSortRef]="sort">Name</button>
</div>

handleSortChange(entry: SortEntry | undefined) {
  this.sortActive.set(entry?.active);
  this.sortDirection.set(entry?.direction);
}
```

**Multi-sort is always uncontrolled** — there is no controlled input for `sortsChange`, only the internal `sorts()` signal.

## Composition with Data Processing

`CngxSort` is orthogonal to all table components. The consumer wires the sort state into a `computed()`:

```typescript
readonly items = signal([
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
]);

readonly sorted = computed(() => {
  const sort = this.sort.sort();
  if (!sort) return this.items();

  const items = [...this.items()];
  items.sort((a, b) => {
    const av = (a as any)[sort.active];
    const bv = (b as any)[sort.active];
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sort.direction === 'asc' ? cmp : -cmp;
  });
  return items;
});

readonly dataSource = injectDataSource(this.sorted);
```

Or use `CngxSmartDataSource` for automatic wiring:

```typescript
readonly sort = inject(CngxSort);
readonly dataSource = injectSmartDataSource(this.items, {
  sortFn: (a, b, field, dir) => {
    // custom sort logic
  },
});
// sort() and sorts() automatically applied
```

## Multi-Sort Example

```typescript
<div [cngxSort]="true" [multiSort]="true" #sort="cngxSort">
  <table>
    <thead>
      <tr>
        <th>
          <button cngxSortHeader="name" [cngxSortRef]="sort" #nameCol="cngxSortHeader">
            Name
            @if (nameCol.isActive()) {
              {{ nameCol.isAsc() ? '↑' : '↓' }} {{ nameCol.priority() }}
            }
          </button>
        </th>
        <th>
          <button cngxSortHeader="age" [cngxSortRef]="sort" #ageCol="cngxSortHeader">
            Age
            @if (ageCol.isActive()) {
              {{ ageCol.isAsc() ? '↑' : '↓' }} {{ ageCol.priority() }}
            }
          </button>
        </th>
      </tr>
    </thead>
    <tbody>
      @for (row of sorted(); track row.id) {
        <tr>
          <td>{{ row.name }}</td>
          <td>{{ row.age }}</td>
        </tr>
      }
    </tbody>
  </table>
</div>

readonly sorted = computed(() => {
  const sorts = this.sort.sorts();
  if (sorts.length === 0) return this.items();

  const items = [...this.items()];
  items.sort((a, b) => {
    for (const { active, direction } of sorts) {
      const av = (a as any)[active];
      const bv = (b as any)[active];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      if (cmp !== 0) {
        return direction === 'asc' ? cmp : -cmp;
      }
    }
    return 0;
  });
  return items;
});
```

## Accessibility

All ARIA attributes are automatically managed:

- `aria-sort="ascending"` / `"descending"` on active headers
- Screen readers announce sort state on navigation
- Multi-sort priority visible in `priority()` signal for visual display to sighted users
- Keyboard: Tab navigates headers, Enter/Space toggles sort

## See Also

- [CngxFilter](../filter/README.md) — predicate-based filtering
- [CngxPaginate](../paginate/README.md) — pagination
- [CngxSmartDataSource](../data-source/README.md) — auto-wires sort + filter + paginate
- Compodoc: Full API reference at `/docs`
