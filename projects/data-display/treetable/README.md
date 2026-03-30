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

## API

### CngxTreetablePresenter Directive

Shared presentation logic applied via `hostDirectives` on both `CngxTreetable` (CDK) and `CngxMaterialTreetable` (Material). Owns tree flattening, expand/collapse state, row selection, and keyboard focus. All inputs and outputs are bound directly on the host component.

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `tree` | `Node<T> \| Node<T>[]` | Required | The tree data; accepts single root or forest (array of roots) |
| `options` | `TreetableOptions<T>` | `{}` | Per-instance display options; overrides global config from `provideTreetable()` |
| `nodeId` | `(node: T, path: readonly number[]) => string` | Auto-generated | Custom function to derive stable ID from node value and path |
| `expandedIds` | `ReadonlySet<string> \| undefined` | `undefined` | Controlled expand state; when bound, overrides internal state (pair with `expandedIdsChange`) |
| `selectionMode` | `'none' \| 'single' \| 'multi'` | `'none'` | Row selection behavior; uses Angular CDK `SelectionModel` |
| `showCheckboxes` | `boolean` | `false` | Show checkbox column (`_select`) in left margin; only meaningful when `selectionMode !== 'none'` |
| `selectedIds` | `ReadonlySet<string> \| undefined` | `undefined` | Controlled selection state; when bound, overrides internal state (pair with `selectedIdsChange`) |
| `trackBy` | `(node: FlatNode<T>) => unknown` | `node => node.id` | Custom identity function for CDK/Material table `trackBy` |
| `state` | `CngxAsyncState<unknown> \| undefined` | `undefined` | Bind async state; drives `aria-busy`, `isLoading`, and `error` signals |

#### Outputs

| Output | Emits | Description |
|-|-|-|
| `nodeClicked` | `FlatNode<T>` | When user clicks a row or activates via keyboard |
| `nodeExpanded` | `FlatNode<T>` | When node transitions from collapsed to expanded |
| `nodeCollapsed` | `FlatNode<T>` | When node transitions from expanded to collapsed |
| `expandedIdsChange` | `ReadonlySet<string>` | After every expand/collapse; use to sync external `expandedIds` |
| `selectionChanged` | `readonly string[]` | Whenever selection changes; array of selected node IDs |
| `selectedIdsChange` | `ReadonlySet<string>` | After every selection change; use to sync external `selectedIds` |

#### Signals (Public)

| Signal | Type | Description |
|-|-|-|
| `flatNodes` | `Signal<FlatNode<T>[]>` | All nodes in tree flattened depth-first |
| `expandedIds` | `Signal<ReadonlySet<string>>` | Current expanded node IDs (mirrors input in controlled mode) |
| `visibleNodes` | `Signal<FlatNode<T>[]>` | Subset of `flatNodes` that should render (all ancestors expanded) |
| `isEmpty` | `Signal<boolean>` | `true` when no visible nodes or state reports empty |
| `isLoading` | `Signal<boolean>` | `true` during initial load (from async state) |
| `isRefreshing` | `Signal<boolean>` | `true` when refreshing (subsequent loads after initial) |
| `isBusy` | `Signal<boolean>` | `true` when loading or refreshing |
| `error` | `Signal<unknown \| null>` | Error from async state, or `null` |
| `columns` | `Signal<string[]>` | Column keys derived from node properties |
| `allColumns` | `Signal<string[]>` | All columns including `_select` (optional) and `_expand` |
| `selectedIds` | `Signal<ReadonlySet<string>>` | Current selected node IDs (mirrors input in controlled mode) |
| `isAllSelected` | `Signal<boolean>` | `true` when every visible node is selected; drives "select all" checkbox |
| `isIndeterminate` | `Signal<boolean>` | `true` when some — but not all — visible nodes are selected |
| `focusedNodeId` | `Signal<string \| null>` | ID of keyboard-focused row, or `null` |

#### Methods

- **`toggleExpand(id: string)`** — Toggle expand/collapse state of node
- **`isSelected(id: string): boolean`** — Check if node with given ID is selected

### CngxTreetable Component

Headless tree table using Angular CDK Table. No Material styles applied.

```html
<cngx-treetable
  [tree]="orgTree()"
  selectionMode="multi"
  [showCheckboxes]="true"
  (nodeClicked)="onNodeClick($event)"
  (nodeExpanded)="onExpanded($event)"
  (selectionChanged)="onSelectionChange($event)"
/>
```

All `CngxTreetablePresenter` inputs/outputs are forwarded via host directives. See Presenter section above for complete API.

### CngxTreetableRow Directive

Applied internally to `<tr>` elements to manage row-level state: expand button, selection checkbox, focus, click/keyboard handlers. No configuration needed.

### Template Directives

#### CngxCellTpl

Custom cell template for a named column. Context is typed as `CngxCellTplContext<T>`:

```html
<cngx-treetable [tree]="tree">
  <ng-template [cngxCell]="'name'" let-node let-value="value">
    <strong>{{ value }}</strong> — depth {{ node.depth }}
  </ng-template>
</cngx-treetable>
```

**Context variables:**
- `let-node` (or `$implicit`) — The full `FlatNode<T>`
- `let-value="value"` — The raw cell value (`node.value[columnKey]`)

#### CngxHeaderTpl

Custom header template for a named column:

```html
<cngx-treetable [tree]="tree">
  <ng-template [cngxHeader]="'name'">
    Full Name <mat-icon>sort</mat-icon>
  </ng-template>
</cngx-treetable>
```

#### CngxEmptyTpl

Template shown when the tree contains no visible rows (or state reports empty):

```html
<cngx-treetable [tree]="tree">
  <ng-template cngxEmpty>
    <p style="text-align: center; padding: 2rem;">
      No organizational data available.
    </p>
  </ng-template>
</cngx-treetable>
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

CngxTreetable is fully accessible:

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

### CSS Classes

**Table:**
- `cngx-treetable` — Root table element
- `cngx-treetable--loading` — Applied when `isLoading()=true`
- `cngx-treetable--empty` — Applied when `isEmpty()=true`

**Rows:**
- `cngx-treetable__row` — Each `<tr>`
- `cngx-treetable__row--focused` — Current keyboard-focused row
- `cngx-treetable__row--expanded` — Node is currently expanded
- `cngx-treetable__row--selected` — Row is selected
- `cngx-treetable__row--hover` — Row is hovered (when `highlightRowOnHover=true`)

**Expand Button:**
- `cngx-treetable__expand` — Expand/collapse button
- `cngx-treetable__expand--leaf` — Node has no children

**Selection Checkbox:**
- `cngx-treetable__checkbox` — Selection checkbox (native `<input type="checkbox">`)

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

- [compodoc API documentation](https://cngxjs.dev/docs/modules/data_display_treetable.html)
- Material variant: `@cngx/data-display/mat-treetable`
- Demo: `dev-app/src/app/demos/data-display/treetable-demo/`
- Tests: `projects/data-display/treetable/src/` (spec files)
