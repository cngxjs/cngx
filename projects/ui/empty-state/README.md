# CngxEmptyState

Empty-state display atom for grids, tables, lists, and dashboards.

## Import

```typescript
import { CngxEmptyState } from '@cngx/ui/empty-state';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxEmptyState } from '@cngx/ui/empty-state';

@Component({
  selector: 'app-example',
  template: `
    <cngx-empty-state title="No search results"
                      description="Try a different search term">
      <mat-icon cngxEmptyStateIcon>search_off</mat-icon>
      <button cngxEmptyStateAction (click)="resetSearch()">
        Clear Search
      </button>
    </cngx-empty-state>
  `,
  imports: [CngxEmptyState],
})
export class ExampleComponent {
  resetSearch(): void {
    // Reset logic
  }
}
```

## Overview

`CngxEmptyState` is an atom component that displays when a collection is empty, providing context about why and what the user can do next. It communicates three distinct UX scenarios:

1. **First-use** — Onboarding, show what's possible
2. **No-results** — Recovery, offer filter reset or search change
3. **Cleared** — Confirmation, everything is done

The component supports icon projection via the `[cngxEmptyStateIcon]` slot (no Material dependency) and action buttons via `[cngxEmptyStateAction]`. Integrates with `CngxAsyncState` for automatic visibility control.

## API

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| title | `string` | required | Primary message — what state the user is in. Displayed as `<h3>`. |
| description | `string \| undefined` | `undefined` | Supporting detail — clarifies context and suggests next steps. Displayed as `<p>`. |
| state | `CngxAsyncState<unknown> \| undefined` | `undefined` | Bind an async state — auto-hides when data is not empty. Takes precedence over direct visibility control. |

### Signals

None exposed directly. The component derives visibility internally from the `state` input.

### Slots (Content Projection)

- **`[cngxEmptyStateIcon]`** — Icon element (projectable scope). No default icon; use `<mat-icon>`, `<svg>`, or any icon system. Falls back to a built-in generic box SVG if omitted.
- **`[cngxEmptyStateIllustration]`** — Optional illustration element (projectable scope).
- **`[cngxEmptyStateAction]`** — Action button(s) (projectable scope). Typically `<button>` or `<a>` elements.
- **`[cngxEmptyStateSecondary]`** — Secondary content below actions (projectable scope).

### CSS Custom Properties

| Property | Default | Description |
|-|-|-|
| `--cngx-empty-state-bg` | transparent | Background color |
| `--cngx-empty-state-color` | inherit | Text color |
| `--cngx-empty-state-padding` | `40px 20px` | Padding |
| `--cngx-empty-state-gap` | `16px` | Gap between icon, title, description, and actions |
| `--cngx-empty-state-icon-size` | `64px` | Width and height of icon |
| `--cngx-empty-state-icon-color` | `--cngx-text-secondary` | Icon color |
| `--cngx-empty-state-title-font-size` | `18px` | Title heading size |
| `--cngx-empty-state-title-font-weight` | `600` | Title font weight |
| `--cngx-empty-state-description-color` | `--cngx-text-secondary` | Description text color |

## Accessibility

`CngxEmptyState` is fully accessible:

- **ARIA roles:** Host is `role="status"` with `aria-live="polite"` — announces empty state changes.
- **Labeling:** Title has `id` bound to `aria-labelledby`; description has `id` bound to `aria-describedby` (when present).
- **Hidden state:** When bound to async state with data, uses `[attr.hidden]` to remove from the accessibility tree.
- **Screen reader:** Icon is `aria-hidden="true"` (decorative); title and description carry the meaning.

## Composition

`CngxEmptyState` composes:

- **Async state integration** — Reads `CngxAsyncState<T>` and auto-hides when data is not empty
- **Content projection** — Four named slots for icon, illustration, actions, and secondary content
- **Auto-ID generation** — Generates unique IDs for title/description ARIA references

## Styling

All colors and spacing use CSS Custom Properties with sensible defaults:

```scss
// Override in your component or global styles
:host {
  --cngx-empty-state-padding: 60px 20px;
  --cngx-empty-state-gap: 24px;
  --cngx-empty-state-icon-size: 80px;
  --cngx-empty-state-title-font-size: 20px;
}
```

## Examples

### Basic No Results

```typescript
<cngx-empty-state title="No results found"
                  description="Your search returned no items.">
  <svg cngxEmptyStateIcon viewBox="0 0 24 24">
    <!-- search off icon -->
  </svg>
</cngx-empty-state>
```

### With Action Button

```typescript
<cngx-empty-state title="No items yet"
                  description="Create your first item to get started.">
  <mat-icon cngxEmptyStateIcon>add_circle_outline</mat-icon>
  <button cngxEmptyStateAction (click)="createItem()">
    Create Item
  </button>
</cngx-empty-state>
```

### With Async State

```typescript
readonly items = injectAsyncState(() => this.http.get('/api/items'));

<cngx-empty-state [state]="items()"
                  title="No items"
                  description="You haven't created any items yet.">
  <mat-icon cngxEmptyStateIcon>inbox</mat-icon>
  <button cngxEmptyStateAction (click)="createItem()">
    Create First Item
  </button>
</cngx-empty-state>

<!-- Automatically shows during first load, hides when data arrives -->
<table *ngIf="items().hasData()">
  <tbody>
    @for (item of items().data(); track item.id) {
      <tr>{{ item.name }}</tr>
    }
  </tbody>
</table>
```

### Multiple Actions

```typescript
<cngx-empty-state title="Filters cleared"
                  description="All filters have been reset.">
  <svg cngxEmptyStateIcon><!-- refresh icon --></svg>
  <div cngxEmptyStateAction>
    <button (click)="undo()">Undo</button>
    <button (click)="close()">Close</button>
  </div>
</cngx-empty-state>
```

### With Illustration

```typescript
<cngx-empty-state title="No notifications"
                  description="You're all caught up!">
  <img cngxEmptyStateIllustration src="empty-inbox.svg" alt="" />
  <button cngxEmptyStateAction (click)="refresh()">
    Refresh
  </button>
</cngx-empty-state>
```

### Within a Data Grid

```typescript
<cngx-grid columns="repeat(auto-fit, minmax(300px, 1fr))" gap="20px">
  @for (item of items(); track item.id) {
    <cngx-card [data]="item" />
  } @empty {
    <cngx-empty-state title="No items"
                      description="Start adding items to see them here.">
      <mat-icon cngxEmptyStateIcon>dashboard</mat-icon>
    </cngx-empty-state>
  }
</cngx-grid>
```

### Styling Variations

```scss
// Compact empty state for sidebar
.empty-sidebar {
  --cngx-empty-state-padding: 20px;
  --cngx-empty-state-gap: 12px;
  --cngx-empty-state-icon-size: 48px;
  --cngx-empty-state-title-font-size: 14px;
}

// Large centered empty state for full page
.empty-full-page {
  --cngx-empty-state-padding: 120px 20px;
  --cngx-empty-state-gap: 32px;
  --cngx-empty-state-icon-size: 120px;
  --cngx-empty-state-title-font-size: 24px;
}
```

## Material Theme

Include the theme SCSS in your global stylesheet:

```scss
@use '@angular/material' as mat;
@use '@cngx/ui/empty-state/empty-state-theme' as empty-state;

$theme: mat.define-theme((...));

html {
  @include mat.all-component-themes($theme);
  @include empty-state.theme($theme);
}
```

The theme mixin provides:
- Material 3 system color tokens (`--mat-sys-*`) with fallback defaults
- Material 2 palette color mappings
- Automatic theme version detection (M3 vs M2)
- Icon and text color alignment with Material palette

## See Also

- [CngxAsyncState](../../../core/src/lib/utils/async-state/) — Async state contract
- [compodoc API documentation](../../../../../docs)
- Demo: `dev-app/src/app/demos/ui/empty-state-demo/`
- Tests: `projects/ui/empty-state/src/empty-state.component.spec.ts`
