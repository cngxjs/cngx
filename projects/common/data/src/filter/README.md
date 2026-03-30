# Filter

Multi-dimensional predicate-based filtering. Track multiple named predicates, combine via AND logic, apply via `computed()`.

## Import

```typescript
import {
  CngxFilter,
  type CngxSmartDataSourceOptions,
} from '@cngx/common/data';
```

## Quick Start

```typescript
import { Component, signal } from '@angular/core';
import { CngxFilter } from '@cngx/common/data';

@Component({
  selector: 'app-list',
  template: `
    <div [cngxFilter]="true" #filter="cngxFilter">
      <label>
        <input
          type="checkbox"
          (change)="toggleRole($event)"
        />
        Show Managers
      </label>
      <ul>
        @for (item of filtered(); track item.id) {
          <li>{{ item.name }}</li>
        }
      </ul>
    </div>
  `,
  imports: [CngxFilter],
})
export class ListComponent {
  readonly items = signal([
    { id: 1, name: 'Alice', role: 'Engineer' },
    { id: 2, name: 'Bob', role: 'Manager' },
    { id: 3, name: 'Carol', role: 'Engineer' },
  ]);

  readonly filtered = computed(() => {
    const p = this.filter.predicate();
    return p ? this.items().filter(p) : this.items();
  });

  toggleRole(event: any) {
    if (event.target.checked) {
      this.filter.addPredicate('role', (item) => item.role === 'Manager');
    } else {
      this.filter.removePredicate('role');
    }
  }

  constructor(private filter: CngxFilter<any>) {}
}
```

## CngxFilter — Filter State Atom

Holds one or more named predicates. All active predicates are AND-combined: an item must pass **every** predicate to appear in results.

Supports both **uncontrolled** (internal state via `addPredicate` / `removePredicate`) and **controlled** (`cngxFilter` input) modes.

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `cngxFilter` | `((value: T) => boolean) \| null` | `null` | **Controlled** predicate. Takes precedence over the `'default'` internal predicate. |

### Outputs

| Output | Emits | Description |
|-|-|-|
| `filterChange` | `((value: T) => boolean) \| null` | Emitted when the `'default'` predicate changes (backward-compat single-filter output). |
| `predicatesChange` | `Map<string, (value: T) => boolean>` | Emitted whenever any named predicate is added or removed. Full map at time of emission. |

### Signals

| Signal | Type | Description |
|-|-|-|
| `predicates()` | `Map<string, (value: T) => boolean>` | All active named predicates. |
| `activeCount()` | `number` | Number of active named predicates (controlled input not counted). |
| `predicate()` | `((value: T) => boolean) \| null` | Combined predicate — AND of all named predicates plus controlled input. Returns `null` when nothing active. |
| `isActive()` | `boolean` | `true` when at least one predicate is active. |

### Methods

#### `addPredicate(key: string, fn: (value: T) => boolean): void`

Add or replace the named predicate `key`. Emits `predicatesChange` with the updated map.

```typescript
filter.addPredicate('location', (item) => selectedLocations.has(item.location));
filter.addPredicate('role', (item) => selectedRoles.has(item.role));
// Both active → AND combined
```

#### `removePredicate(key: string): void`

Remove the named predicate `key` (no-op if not present). Emits `predicatesChange`.

```typescript
filter.removePredicate('location');
// 'role' predicate still active
```

#### `setPredicate(fn: ((value: T) => boolean) | null): void`

Set the `'default'` predicate and emit `filterChange`. Pass `null` to clear it.

```typescript
filter.setPredicate((item) => item.active === true);
```

#### `clear(): void`

Remove all named predicates and emit both `filterChange(null)` and `predicatesChange(new Map())`.

```typescript
filter.clear();
// All predicates gone, predicate() returns null
```

## AND vs OR Logic

The directive enforces **AND across dimensions** (keys). **OR logic within a dimension** lives inside the predicate function:

```typescript
// AND across dimensions: location AND role must both match
filter.addPredicate('location', (p) => selectedLocations.has(p.location));
filter.addPredicate('role', (p) => selectedRoles.has(p.role));

// OR within a dimension: London OR Paris — one predicate with a Set inside
filter.addPredicate('location', (p) => selectedCities.has(p.location));
// selectedCities = new Set(['London', 'Paris'])
```

## Controlled vs Uncontrolled

### Uncontrolled (Default)

Directives manage state via `addPredicate` / `removePredicate`:

```typescript
<div [cngxFilter]="true" #filter="cngxFilter">
  <!-- checkboxes call filter.addPredicate() / removePredicate() -->
</div>
```

### Controlled

Parent drives predicate via `cngxFilter` input (single predicate):

```typescript
readonly predicate = signal<((v: any) => boolean) | null>(null);

<div
  [cngxFilter]="true"
  [cngxFilter]="predicate()"
  (filterChange)="handleFilterChange($event)"
  #filter="cngxFilter"
>
  <!-- ... -->
</div>

handleFilterChange(pred: ((v: any) => boolean) | null) {
  this.predicate.set(pred);
}
```

**Backward-compatible:** The controlled input maps to the `'default'` key internally. Named predicates (`addPredicate`) still work alongside it.

## Composition with Data Processing

`CngxFilter` is orthogonal to tables and lists. The consumer wires the predicate into a `computed()`:

```typescript
readonly items = signal([/* data */]);
readonly filter = inject(CngxFilter<Item>);

readonly filtered = computed(() => {
  const pred = this.filter.predicate();
  return pred ? this.items().filter(pred) : this.items();
});

readonly dataSource = injectDataSource(this.filtered);
```

Or use `CngxSmartDataSource` for automatic wiring:

```typescript
readonly filter = inject(CngxFilter<Item>);
readonly dataSource = injectSmartDataSource(this.items);
// filter.predicate() automatically applied
```

## Multi-Dimensional Filtering Example

```typescript
@Component({
  selector: 'app-residents',
  template: `
    <div [cngxFilter]="true" #filter="cngxFilter">
      <div>
        <h3>Location</h3>
        @for (loc of locations(); track loc) {
          <label>
            <input
              type="checkbox"
              (change)="toggleLocation(loc, $event)"
            />
            {{ loc }}
          </label>
        }
      </div>

      <div>
        <h3>Role</h3>
        @for (role of roles(); track role) {
          <label>
            <input
              type="checkbox"
              (change)="toggleRole(role, $event)"
            />
            {{ role }}
          </label>
        }
      </div>

      <table [dataSource]="dataSource">
        <!-- table template -->
      </table>
    </div>
  `,
  imports: [CngxFilter],
})
export class ResidentsComponent {
  readonly items = signal([
    { id: 1, name: 'Alice', location: 'London', role: 'Engineer' },
    { id: 2, name: 'Bob', location: 'Paris', role: 'Manager' },
  ]);

  locations = signal(['London', 'Paris', 'Berlin']);
  roles = signal(['Engineer', 'Manager', 'Designer']);

  selectedLocations = signal(new Set<string>());
  selectedRoles = signal(new Set<string>());

  filter = inject(CngxFilter<any>);

  readonly dataSource = injectSmartDataSource(this.items);

  toggleLocation(location: string, event: any) {
    const selected = new Set(this.selectedLocations());
    if (event.target.checked) {
      selected.add(location);
    } else {
      selected.delete(location);
    }
    this.selectedLocations.set(selected);
    this.updateLocationPredicate();
  }

  toggleRole(role: string, event: any) {
    const selected = new Set(this.selectedRoles());
    if (event.target.checked) {
      selected.add(role);
    } else {
      selected.delete(role);
    }
    this.selectedRoles.set(selected);
    this.updateRolePredicate();
  }

  private updateLocationPredicate() {
    const selected = this.selectedLocations();
    if (selected.size === 0) {
      this.filter.removePredicate('location');
    } else {
      this.filter.addPredicate('location', (item) => selected.has(item.location));
    }
  }

  private updateRolePredicate() {
    const selected = this.selectedRoles();
    if (selected.size === 0) {
      this.filter.removePredicate('role');
    } else {
      this.filter.addPredicate('role', (item) => selected.has(item.role));
    }
  }
}
```

## Accessibility

`CngxFilter` does not set ARIA attributes. The consuming component (table, list, form) handles:

- `aria-label` on filter controls
- `aria-busy` while filtering is in progress
- Announcements of active filters via `aria-live` region (optional)

Example:

```html
<div [cngxFilter]="true" #filter="cngxFilter">
  @if (filter.isActive()) {
    <div class="active-filters" aria-live="polite">
      Active filters: {{ filter.activeCount() }}
    </div>
  }

  <label>
    <input type="checkbox" (change)="toggleRole($event)" />
    Show Managers
  </label>
</div>
```

## See Also

- [CngxSort](../sort/README.md) — multi-column sorting
- [CngxPaginate](../paginate/README.md) — pagination
- [CngxSmartDataSource](../data-source/README.md) — auto-wires filter + sort + paginate
- Compodoc: Full API reference at `/docs`
