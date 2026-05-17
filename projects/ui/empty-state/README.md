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
    <cngx-empty-state title="No search results" description="Try a different search term">
      <mat-icon cngxEmptyStateIcon>search_off</mat-icon>
      <button cngxEmptyStateAction (click)="resetSearch()">Clear Search</button>
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

## Material Theme

Include the theme SCSS in your global stylesheet:

```scss
@use '@angular/material' as mat;
@use '@cngx/themes/material/empty-state-theme' as empty-state;

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

- [CngxAsyncState](../../core/utils/) — Async state contract
- [compodoc API documentation](https://cngxjs.github.io/cngx/)
- Demo: `dev-app/src/app/demos/ui/empty-state-demo/`
- Tests: `projects/ui/empty-state/empty-state.component.spec.ts`
