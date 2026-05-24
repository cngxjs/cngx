# CngxTreetable (CDK)

Headless tree table built on Angular CDK Table. Renders fully unstyled, accessible tree hierarchies with expand/collapse, selection, keyboard navigation, and async state integration. All visual styling is provided via CSS custom properties for complete theming freedom.

## Import

```typescript
import {
  CngxTreetable,
  CngxTreetablePresenter,
  CngxTreetableRow,
  CngxCellTpl,
  CngxHeaderTpl,
  CngxEmptyTpl,
  provideTreetable,
  type Node,
  type FlatNode,
  type TreetableOptions,
} from '@cngx/data-display/treetable';
```

## Quick Start

```typescript
import { Component, signal } from '@angular/core';
import {
  CngxTreetable,
  CngxCellTpl,
  CngxEmptyTpl,
  type Node,
} from '@cngx/data-display/treetable';

interface OrgNode {
  name: string;
  title: string;
}

@Component({
  selector: 'app-example',
  template: `
    <cngx-treetable [tree]="orgTree()" (nodeClicked)="onNodeClick($event)">
      <ng-template [cngxCell]="'name'" let-node let-value="value">
        <strong>{{ value }}</strong> ({{ node.depth }})
      </ng-template>
      <ng-template cngxEmpty>
        <p>No organizational data</p>
      </ng-template>
    </cngx-treetable>
  `,
  imports: [CngxTreetable, CngxCellTpl, CngxEmptyTpl],
})
export class ExampleComponent {
  orgTree = signal<Node<OrgNode>>({
    value: { name: 'CEO', title: 'Chief Executive Officer' },
    children: [
      {
        value: { name: 'VP Engineering', title: 'Vice President' },
        children: [
          { value: { name: 'Engineer A', title: 'Software Engineer' } },
          { value: { name: 'Engineer B', title: 'Software Engineer' } },
        ],
      },
      { value: { name: 'VP Marketing', title: 'Vice President' } },
    ],
  });

  onNodeClick(node: FlatNode<OrgNode>) {
    console.log('Clicked:', node.value.name);
  }
}
```

## Data Structure

### Node<T>

Input tree structure:

```typescript
interface Node<T> {
  value: T;                // The data value
  children?: Node<T>[];    // Child nodes; absent or empty = leaf
}
```

### FlatNode<T>

Flattened representation (what templates receive):

```typescript
interface FlatNode<T> {
  readonly id: string;                    // Stable ID
  readonly value: T;                      // Original data
  readonly depth: number;                 // 0-based nesting depth
  readonly hasChildren: boolean;          // Has child nodes
  readonly parentIds: readonly string[];  // Ancestor IDs from root
}
```

### TreetableOptions<T>

Per-instance display options:

```typescript
interface TreetableOptions<T> {
  highlightRowOnHover?: boolean;              // Visual hover effect
  customColumnOrder?: readonly (keyof T & string)[]; // Column ordering
  capitaliseHeader?: boolean;                 // Uppercase first letter of headers
}
```

## Accessibility

- **ARIA roles:** `role="treegrid"` (implicit from CDK table), rows have `role="row"`, expand buttons have `role="button"` with `aria-expanded`
- **Keyboard interaction:**
  - `Arrow Down / Up`: Navigate rows
  - `Arrow Right`: Expand selected row
  - `Arrow Left`: Collapse selected row or move to parent
  - `Space / Enter`: Click or toggle checkbox
  - `Home / End`: Jump to first/last row
  - `Ctrl+A`: Select all visible nodes (when multi-select)
- **Screen reader:** Row indices announced; expand/collapse state communicated via `aria-expanded`; selection state via `aria-selected`; checkbox state via native `<input type="checkbox">`
- **Focus management:** Row focus managed internally; focusedNodeId signal tracks which row has keyboard focus

## Composition

`CngxTreetablePresenter` is composed as a `hostDirective` on both `CngxTreetable` and `CngxMaterialTreetable`, making the full presenter API available on the component host.

### Example: With Async Data Loading

```typescript
readonly dataState = injectAsyncState(() =>
  this.dataService.loadOrgTree().pipe(
    tapAsyncState(this.dataState),
  )
);

readonly tree = computed(() => this.dataState().data() ?? []);
```

```html
<cngx-treetable
  [tree]="tree()"
  [state]="dataState()"
  selectionMode="multi"
  [showCheckboxes]="true"
  [(expandedIds)]="expandedIds"
  [(selectedIds)]="selectedIds"
  (nodeClicked)="onNodeClick($event)"
>
  <ng-template [cngxCell]="'name'" let-node let-value="value">
    {{ value }}
  </ng-template>

  <ng-template cngxEmpty>
    <p>No data available</p>
  </ng-template>
</cngx-treetable>
```

## Styling

CngxTreetable is entirely unstyled. All visual appearance is controlled via CSS custom properties and classes.

### CSS Custom Properties

| Property | Default | Description |
|-|-|-|
| `--cngx-treetable-row-height` | `44px` | Height of each row |
| `--cngx-treetable-border-color` | `#e0e0e0` | Border color between rows/columns |
| `--cngx-treetable-bg` | `#ffffff` | Background color |
| `--cngx-treetable-hover-bg` | `#f5f5f5` | Background when hovering (with `highlightRowOnHover=true`) |
| `--cngx-treetable-selected-bg` | `#e8f5e9` | Background when selected |
| `--cngx-treetable-focus-outline` | `2px solid var(--cngx-focus-color, #1976d2)` | Focus ring style |
| `--cngx-treetable-padding-inline` | `12px` | Left/right padding in cells |
| `--cngx-treetable-padding-block` | `8px` | Top/bottom padding in cells |
| `--cngx-treetable-indent-size` | `24px` | Indentation per nesting level |

## Configuration

### provideTreetable

Configure application-wide defaults:

```typescript
bootstrapApplication(AppComponent, {
  providers: [
    provideTreetable({
      highlightRowOnHover: true,
      capitaliseHeader: true,
    }),
  ],
});
```

Per-instance `options` input overrides these defaults.

## Controlled vs. Uncontrolled

### Uncontrolled (Default)

Treetable manages its own expand and selection state:

```html
<cngx-treetable
  [tree]="tree()"
  selectionMode="multi"
  (nodeClicked)="onNodeClick($event)"
/>
```

### Controlled

External state drives expand/selection:

```typescript
expandedIds = signal<Set<string>>(new Set(['0', '0-0']));
selectedIds = signal<Set<string>>(new Set());
```

```html
<cngx-treetable
  [tree]="tree()"
  [(expandedIds)]="expandedIds"
  [(selectedIds)]="selectedIds"
  selectionMode="multi"
  (nodeClicked)="onNodeClick($event)"
/>
```

## Examples

### Basic Tree with Expand/Collapse

```html
<cngx-treetable [tree]="orgTree()" (nodeClicked)="onSelect($event)" />
```

### With Custom Cell Template and Selection

```html
<cngx-treetable
  [tree]="tree()"
  selectionMode="multi"
  [showCheckboxes]="true"
  (selectionChanged)="selected = $event"
>
  <ng-template [cngxCell]="'name'" let-node let-value="value">
    <strong>{{ value }}</strong>
  </ng-template>

  <ng-template [cngxCell]="'status'" let-value="value">
    <span [class.active]="value === 'active'">{{ value }}</span>
  </ng-template>

  <ng-template cngxEmpty>
    <p>No employees found</p>
  </ng-template>
</cngx-treetable>
```

### With Async Loading and Error State

```html
<cngx-treetable
  [tree]="data()"
  [state]="state()"
  selectionMode="single"
  [(selectedIds)]="selectedIds"
>
  <ng-template [cngxCell]="'name'" let-value="value">
    {{ value }}
  </ng-template>

  <ng-template cngxEmpty>
    <p>No data</p>
  </ng-template>
</cngx-treetable>

@if (state().error(); as err) {
  <cngx-alert severity="error">
    {{ err.message ?? 'Failed to load data' }}
  </cngx-alert>
}
```

## See Also

- [API on compodocx](https://cngxjs.github.io/cngx/)
- Material variant: `@cngx/data-display/mat-treetable`
- Demo: `examples/stories/data-display/treetable-demo/`
- Tests: `projects/data-display/treetable/` (spec files)
