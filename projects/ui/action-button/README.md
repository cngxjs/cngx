# CngxActionButton

Action button molecule combining async state tracking, visual feedback, and optional toast notifications.

## Import

```typescript
import { CngxActionButton } from '@cngx/ui';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxActionButton } from '@cngx/ui';

@Component({
  selector: 'app-example',
  template: ` <cngx-action-button [action]="save"> Save Draft </cngx-action-button> `,
  imports: [CngxActionButton],
})
export class ExampleComponent {
  save = () => this.http.post('/api/draft', {});
}
```

## Overview

`CngxActionButton` is a molecule wrapping the `CngxAsyncClick` directive with built-in state communication, template slots, and optional toast integration. It uses `display: contents` - the host produces no DOM box; the inner `<button>` carries the directive directly.

The component supports three visual feedback pathways:

1. **Fallback labels** - `pendingLabel`, `succeededLabel`, `failedLabel` strings
2. **Template slots** - `cngxPending`, `cngxSucceeded`, `cngxFailed` directives
3. **Automatic state prop** - bind `btn.state` to any state consumer

A screen-reader-only `aria-live` region announces state transitions without visual noise.

## Accessibility

- **ARIA roles:** The inner `<button>` carries all ARIA attributes from `CngxAsyncClick` - `aria-busy` when pending, no explicit role (semantic `<button>`).
- **Keyboard interaction:**
  - `Enter` / `Space` - Activate the action
  - `Escape` - No special behavior (standard button)
- **Screen reader:** `aria-live="polite"` region announces state transitions: "Action succeeded", "Action failed", and the optional custom announcements via `succeededAnnouncement` / `failedAnnouncement`.
- **Focus management:** Focus remains on the button throughout the lifecycle - no focus trap or restoration.

## Composition

`CngxActionButton` is built from these atomic units and integrates with:

- **Host directives:** Applies `CngxAsyncClick` directly on the inner `<button>` (not exposed as hostDirective).
- **Combines with:** `CngxPending`, `CngxSucceeded`, `CngxFailed` template marker directives; `CngxToaster` for toast integration.
- **Provides:** The `state` signal export for binding to any async state consumer.

### Example: Composition Pattern

```typescript
// Bind button state to an alert
<cngx-action-button #btn="cngxActionButton" [action]="save">
  Save
</cngx-action-button>
<cngx-alert [state]="btn.state" title="Save Status" />
```

## Styling

All colors and spacing use CSS Custom Properties with Material 3 defaults. Override at any scope:

```scss
// Override defaults in your component or global styles
:host {
  --cngx-action-btn-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --cngx-action-btn-radius: 8px;
  --cngx-action-btn-primary-bg: #1565c0;
  --cngx-action-btn-primary-color: #fff;
}
```

## Material Theme

To apply Material Design 3 theme colors, include the theme SCSS in your global stylesheet:

```scss
@use '@angular/material' as mat;
@use '@cngx/themes/material/action-button-theme' as action-btn;

$theme: mat.define-theme((...));

html {
  @include mat.all-component-themes($theme);
  @include action-btn.theme($theme);
}
```

The theme mixin automatically derives success/error colors from Material's primary and error palettes. Both Material 3 (M3) and Material 2 (M2) are supported; colors adapt to the theme version automatically.
