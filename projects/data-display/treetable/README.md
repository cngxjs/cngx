# CngxTreetable (CDK)

Headless tree table built on Angular CDK Table. Renders fully unstyled, accessible tree hierarchies with expand/collapse, selection, keyboard navigation, and async state integration. All visual styling is provided via CSS custom properties for complete theming freedom.

## Import

```typescript
import {
  CngxTreetable,
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
  type FlatNode,
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

- **ARIA roles:** `role="treegrid"` is set explicitly on the CDK table host (CDK's own default would be `table`); rows have `role="row"`, expand buttons have `role="button"` with `aria-expanded`
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

All inputs, outputs, computeds, and methods live directly on `CngxTreetable`; the API tab on the doc page covers the full surface.

### Example: With Async Data Loading

```typescript
readonly dataState = injectAsyncState(() => this.dataService.loadOrgTree());
readonly tree = computed(() => this.dataState.data() ?? []);
```

`injectAsyncState` returns a `ReactiveAsyncState<T>` object (signals as
members, not a signal of an object) and drives the whole
loading/refreshing/error lifecycle itself - no extra `tap` wiring.

```html
<cngx-treetable
  [tree]="tree()"
  [state]="dataState"
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

Defaults are the literal fallbacks from the component stylesheet; color
tokens delegate to the global `--cngx-color-*` palette first.

| Property | Default | Description |
|-|-|-|
| `--cngx-treetable-font-size` | `0.875rem` | Base font size of the grid |
| `--cngx-treetable-indent-size` | `1.5rem` | Indentation per nesting level |
| `--cngx-treetable-header-bg` | `oklch(0.98 0.005 250)` | Header row background |
| `--cngx-treetable-header-color` | `var(--cngx-color-text, oklch(0.34 0.015 250))` | Header text color |
| `--cngx-treetable-header-font-weight` | `600` | Header font weight |
| `--cngx-treetable-header-border` | `var(--cngx-color-border, oklch(0.92 0.005 250))` | Header bottom border color |
| `--cngx-treetable-header-border-width` | `2px` | Header bottom border width |
| `--cngx-treetable-row-border` | `var(--cngx-color-border, oklch(0.96 0.005 250))` | Row separator color |
| `--cngx-treetable-row-border-width` | `1px` | Row separator width |
| `--cngx-treetable-row-hover-bg` | `oklch(0.97 0.015 250)` | Row background on hover (`withHighlightOnHover()`) |
| `--cngx-treetable-row-selected-bg` | `oklch(0.95 0.025 250)` | Selected row background |
| `--cngx-treetable-row-transition-duration` | `120ms` | Row background transition |
| `--cngx-treetable-cell-color` | `var(--cngx-color-text, oklch(0.34 0.015 250))` | Cell text color |
| `--cngx-treetable-cell-padding-block` | `0.6rem` | Cell top/bottom padding |
| `--cngx-treetable-cell-padding-inline` | `1rem` | Cell left/right padding |
| `--cngx-treetable-cell-direction` | `revert` | Per-cell writing-direction override |
| `--cngx-treetable-cell-bidi` | `isolate` | Per-cell unicode-bidi isolation |
| `--cngx-treetable-focus-ring` | `var(--cngx-color-primary, oklch(0.66 0.19 50))` | Focus ring color |
| `--cngx-treetable-focus-ring-width` | `2px` | Focus ring width |
| `--cngx-treetable-muted-color` | `oklch(0.5 0.015 250)` | Muted/secondary text color |
| `--cngx-treetable-toggle-font-size` | `0.875rem` | Expand toggle glyph size |
| `--cngx-treetable-toggle-padding` | `0.25rem` | Expand toggle hit-area padding |
| `--cngx-treetable-toggle-radius` | `4px` | Expand toggle corner radius |
| `--cngx-treetable-toggle-transition-duration` | `120ms` | Expand toggle transition |
| `--cngx-treetable-empty-font-size` | `0.875rem` | Empty-state text size |
| `--cngx-treetable-empty-padding-block` | `2rem` | Empty-state top/bottom padding |
| `--cngx-treetable-empty-padding-inline` | `1rem` | Empty-state left/right padding |
| `--cngx-treetable-skeleton-line-size` | `12px` | Skeleton line height |

Below the width recorded by the informational
`--cngx-treetable-narrow-breakpoint` token the grid compacts through the
`--cngx-treetable-narrow-*` family (font-size, indent-size, cell/header
paddings, toggle sizing) - same names as above with the `narrow-` prefix.

## Configuration

### provideTreetable

Configure application-wide defaults:

```typescript
bootstrapApplication(AppComponent, {
  providers: [
    provideTreetable(withHighlightOnHover(), withCapitaliseHeaders()),
  ],
});
```

`provideTreetable(...features)` takes composable features, not an options
object: `withHighlightOnHover()`, `withCapitaliseHeaders()`,
`withTreetableLabels({ ... })` and `withTreetableTemplates({ ... })`.
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
// ReadonlySet matches the model<ReadonlySet<string>> inputs - a
// signal<Set<string>> two-way binding fails under strictTemplates.
expandedIds = signal<ReadonlySet<string>>(new Set(['0', '0-0']));
selectedIds = signal<ReadonlySet<string>>(new Set());
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
  [(selectedIds)]="selected"
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
- Demo: `examples/stories/data-display/treetable-demo/`
- Tests: `projects/data-display/treetable/` (spec files)
