# CngxMaterialTreetable

Angular Material tree table variant. Renders tree hierarchies using Material Design components (`MatTable`, `MatCheckbox`, `MatIcon`) with full Material theming support. Shares all presenter logic with the CDK variant via `CngxTreetablePresenter`.

## Import

```typescript
import {
  CngxMaterialTreetable,
  type Node,
  type FlatNode,
} from '@cngx/data-display/mat-treetable';

// Re-exported from CDK variant for template directives
import {
  CngxCellTpl,
  CngxHeaderTpl,
  CngxEmptyTpl,
} from '@cngx/data-display/treetable';
```

## Quick Start

```typescript
import { Component, signal } from '@angular/core';
import { CngxMaterialTreetable, CngxCellTpl } from '@cngx/data-display/mat-treetable';
import { CngxEmptyTpl } from '@cngx/data-display/treetable';

interface Person {
  name: string;
  department: string;
  email: string;
}

@Component({
  selector: 'app-example',
  template: `
    <cngx-mat-treetable
      [tree]="employees()"
      selectionMode="multi"
      [showCheckboxes]="true"
      (selectionChanged)="onSelection($event)"
    >
      <ng-template [cngxCell]="'department'" let-value="value">
        <mat-chip>{{ value }}</mat-chip>
      </ng-template>

      <ng-template cngxEmpty>
        <div style="padding: 2rem; text-align: center;">
          <p>No employees</p>
        </div>
      </ng-template>
    </cngx-mat-treetable>
  `,
  imports: [CngxMaterialTreetable, CngxCellTpl, CngxEmptyTpl],
})
export class ExampleComponent {
  employees = signal<Node<Person>[]>([
    {
      value: { name: 'Sarah Chen', department: 'Engineering', email: 'sarah@company.com' },
      children: [
        { value: { name: 'Alex Lee', department: 'Frontend', email: 'alex@company.com' } },
        { value: { name: 'Jordan Kim', department: 'Backend', email: 'jordan@company.com' } },
      ],
    },
    {
      value: { name: 'Pat Morgan', department: 'Design', email: 'pat@company.com' },
    },
  ]);

  onSelection(selectedIds: readonly string[]) {
    console.log('Selected:', selectedIds);
  }
}
```

## API

All inputs, outputs, and signals are identical to `CngxTreetable` (the CDK variant), as they both use `CngxTreetablePresenter` via `hostDirectives`. See the CDK README for complete API documentation.

### Unique Features

#### Material Components

CngxMaterialTreetable uses Material Design components for native integration:

- **Expand/collapse buttons** — Material icon buttons with Material icons (`expand_more`, `expand_less`)
- **Selection checkboxes** — Material `<mat-checkbox>` with Material Design styling
- **Table structure** — Material `<mat-table>` with Material rows and cells
- **Icons** — Material icon font for expand/collapse indicators

#### Material Theming

The table responds to Material 3 theme colors and typography:

```scss
@use '@angular/material' as mat;
@use '@cngx/data-display/mat-treetable/mat-treetable-theme' as treetable;

$theme: mat.define-theme(/* ... */);

html {
  @include mat.all-component-themes($theme);
  @include treetable.theme($theme);
}
```

Density support via Material density system:

```scss
@include treetable.density(-1); // compact
@include treetable.density(0);  // default
@include treetable.density(1);  // comfortable
```

## Styling

### CSS Classes

Same as CDK variant, applied to Material table elements:

- `cngx-mat-treetable` — Root `<mat-table>`
- `cngx-mat-treetable--loading` — Applied when `isLoading()=true`
- `cngx-mat-treetable--empty` — Applied when `isEmpty()=true`
- `cngx-mat-treetable__row` — Each Material `<mat-table-row>`
- `cngx-mat-treetable__row--focused` — Keyboard-focused row
- `cngx-mat-treetable__row--expanded` — Node is expanded
- `cngx-mat-treetable__row--selected` — Row is selected
- `cngx-mat-treetable__row--hover` — Row is hovered

### CSS Custom Properties

Same as CDK variant, plus Material token overrides:

| Property | Material Token | Description |
|-|-|-|
| `--cngx-mat-treetable-bg` | `mat.get-color-from-palette($theme, 'surface')` | Background color |
| `--cngx-mat-treetable-border-color` | `mat.get-color-from-palette($theme, 'outline-variant')` | Border color |
| `--cngx-mat-treetable-hover-bg` | `mat.get-color-from-palette($theme, 'surface-container-highest')` | Hover background |
| `--cngx-mat-treetable-selected-bg` | `mat.get-color-from-palette($theme, 'primary', 0.12)` | Selection background |
| `--cngx-mat-treetable-row-height` | Density-dependent | Height per row |

## Template Directives

All template directives from the CDK variant work identically:

- **`[cngxCell]="'columnName'`** — Custom cell template
- **`[cngxHeader]="'columnName'`** — Custom header template
- **`cngxEmpty`** — Empty state template

```html
<cngx-mat-treetable [tree]="data()">
  <ng-template [cngxCell]="'name'" let-node let-value="value">
    <strong>{{ value }}</strong> (depth: {{ node.depth }})
  </ng-template>

  <ng-template [cngxHeader]="'name'">
    Employee Name
  </ng-template>

  <ng-template cngxEmpty>
    <p>No employees</p>
  </ng-template>
</cngx-mat-treetable>
```

## Accessibility

Identical to CDK variant, using Material-provided accessibility features:

- **Keyboard navigation** — Arrow keys, Space, Enter, Home, End
- **Screen reader announcements** — Native Material table ARIA, expand state via `aria-expanded`, selection via `aria-selected`
- **Focus management** — Automatic focus ring styling (Material focus ring)
- **Checkboxes** — Native `<mat-checkbox>` with full accessibility

## Composition

Like `CngxTreetable`, this component composes `CngxTreetablePresenter` via `hostDirectives`:

```typescript
hostDirectives: [
  {
    directive: CngxTreetablePresenter,
    inputs: [
      'tree',
      'options',
      'nodeId',
      'expandedIds',
      'selectionMode',
      'showCheckboxes',
      'selectedIds',
      'trackBy',
      'state',
    ],
    outputs: [
      'nodeClicked',
      'nodeExpanded',
      'nodeCollapsed',
      'expandedIdsChange',
      'selectionChanged',
      'selectedIdsChange',
    ],
  },
]
```

All presenter inputs/outputs are forwarded to the component host.

## Examples

### Basic Table with Material Styling

```html
<cngx-mat-treetable [tree]="orgChart()" (nodeClicked)="onNodeClick($event)" />
```

### With Custom Cells and Material Chips

```html
<cngx-mat-treetable
  [tree]="employees()"
  selectionMode="multi"
  [showCheckboxes]="true"
>
  <ng-template [cngxCell]="'name'" let-value="value">
    <mat-cell>{{ value }}</mat-cell>
  </ng-template>

  <ng-template [cngxCell]="'status'" let-value="value">
    <mat-chip
      [matChipSet]="readonly"
      [highlighted]="value === 'active'"
    >
      {{ value }}
    </mat-chip>
  </ng-template>

  <ng-template [cngxHeader]="'status'">
    <mat-header-cell>Status</mat-header-cell>
  </ng-template>

  <ng-template cngxEmpty>
    <div style="padding: 2rem; text-align: center;">
      <p>No employees found</p>
    </div>
  </ng-template>
</cngx-mat-treetable>
```

### With Async Data and Material Icons

```typescript
readonly employees$ = this.service.getEmployeeHierarchy();
readonly state = injectAsyncState(() => this.employees$);
readonly employees = computed(() => this.state().data() ?? []);
```

```html
<cngx-mat-treetable
  [tree]="employees()"
  [state]="state()"
  [(expandedIds)]="expandedIds"
  [(selectedIds)]="selectedIds"
  selectionMode="multi"
  [showCheckboxes]="true"
>
  <ng-template [cngxCell]="'name'" let-node let-value="value">
    @if (node.hasChildren) {
      <mat-icon>person</mat-icon>
    } @else {
      <mat-icon>account_circle</mat-icon>
    }
    {{ value }}
  </ng-template>

  <ng-template [cngxHeader]="'name'">
    <strong>Name</strong>
  </ng-template>

  <ng-template cngxEmpty>
    <div style="padding: 2rem; text-align: center;">
      <mat-icon style="font-size: 48px; color: rgba(0,0,0,0.2);">
        people_outline
      </mat-icon>
      <p>No employees</p>
    </div>
  </ng-template>
</cngx-mat-treetable>

@if (state().error(); as err) {
  <mat-card style="margin-top: 1rem;">
    <mat-card-title>Error</mat-card-title>
    <mat-card-content>{{ err.message }}</mat-card-content>
  </mat-card>
}
```

### With Material Button Toolbar

```html
<div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
  <button mat-raised-button (click)="expandAll()">
    <mat-icon>unfold_more</mat-icon>
    Expand All
  </button>
  <button mat-raised-button (click)="collapseAll()">
    <mat-icon>unfold_less</mat-icon>
    Collapse All
  </button>
  <button
    mat-raised-button
    color="accent"
    [disabled]="selectedIds().size === 0"
    (click)="deleteSelected()"
  >
    <mat-icon>delete</mat-icon>
    Delete Selected
  </button>
</div>

<cngx-mat-treetable
  [tree]="employees()"
  [(expandedIds)]="expandedIds"
  [(selectedIds)]="selectedIds"
  selectionMode="multi"
  [showCheckboxes]="true"
/>
```

## Material Theme File

The library ships `mat-treetable-theme.scss` which defines:

1. **Color tokens** — Mapsto Material 3 color palette (surface, outline, primary, etc.)
2. **Typography** — Uses Material font scale
3. **Density mixins** — Responsive spacing based on Material density system
4. **Focus ring** — Material focus ring implementation

Apply the theme in your global styles:

```scss
@use '@angular/material' as mat;
@use '@cngx/data-display/mat-treetable/mat-treetable-theme' as treetable;

$theme: mat.define-theme(/* ... */);

html {
  @include mat.all-component-themes($theme);
  @include treetable.theme($theme);
  @include treetable.density(0); // or -1, 1
}
```

## Comparison: CDK vs. Material

| Aspect | CDK (`CngxTreetable`) | Material (`CngxMaterialTreetable`) |
|-|-|-|
| **Components** | CDK primitives | Material components |
| **Styling** | CSS only | Material theme + CSS custom properties |
| **Bundle** | Lightweight | Includes Material bundle |
| **Theme support** | No theme system | Full Material 3 theming |
| **Icons** | None (bring your own) | Material icons built-in |
| **Checkboxes** | Native `<input type="checkbox">` | `<mat-checkbox>` |
| **Density** | Manual via CSS | Material density system |

Choose **CDK** for:
- Lightweight applications with minimal Material usage
- Complete styling control without Material constraints
- Custom component designs

Choose **Material** for:
- Material Design consistency across the app
- Material theme customization (colors, typography, density)
- Consistent Material components (icons, checkboxes, etc.)

## See Also

- [compodoc API documentation](https://cngxjs.dev/docs/modules/data_display_mat_treetable.html)
- CDK variant: `@cngx/data-display/treetable`
- Demo: `dev-app/src/app/demos/data-display/mat-treetable-demo/`
- Tests: `projects/data-display/mat-treetable/src/` (spec files)
