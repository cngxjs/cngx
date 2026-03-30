# Close Button

Shared close/dismiss button atom for alerts, toasts, and popovers.

## Import

```typescript
import { CngxCloseButton, CNGX_CLOSE_ICON } from '@cngx/common/interactive';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxCloseButton } from '@cngx/common/interactive';

@Component({
  selector: 'app-alert',
  template: `
    <div role="alert">
      <p>Something went wrong.</p>
      <cngx-close-button label="Close alert" (pressed)="closeAlert()" />
    </div>
  `,
  imports: [CngxCloseButton],
})
export class AlertComponent {
  closeAlert() {
    console.log('Alert closed');
  }
}
```

## API

### CngxCloseButton Component

A configurable close/dismiss button atom used across cngx feedback components.

#### Inputs

|-|-|-|-|
| label | string | required | Accessible label for the button (e.g., "Close dialog", "Dismiss notification") |

#### Outputs

|-|-|-|
| — | — | — |

#### Signals

None (state managed by parent component)

#### CSS Custom Properties

- `--cngx-close-button-bg` (none) — Button background color
- `--cngx-close-button-border` (none) — Button border
- `--cngx-close-button-size` (32px) — Button min-width and min-height
- `--cngx-close-button-padding` (8px) — Button padding
- `--cngx-close-button-color` (inherit) — Button/icon color
- `--cngx-close-button-opacity` (0.5) — Resting opacity
- `--cngx-close-button-radius` (4px) — Border radius
- `--cngx-close-button-transition` (150ms) — Opacity transition duration
- `--cngx-close-button-hover-opacity` (1) — Opacity on hover
- `--cngx-close-button-hover-bg` (rgba(0, 0, 0, 0.04)) — Background on hover
- `--cngx-close-button-focus-outline` (2px solid currentColor) — Focus ring
- `--cngx-close-button-focus-offset` (2px) — Focus ring offset
- `--cngx-close-button-active-opacity` (0.8) — Opacity on active/press
- `--cngx-close-button-icon-size` (16px) — Icon width and height

### CNGX_CLOSE_ICON Token

Injection token for globally overriding the close icon component.

```typescript
const CNGX_CLOSE_ICON = new InjectionToken<Type<unknown>>('CngxCloseIcon');
```

## Accessibility

CngxCloseButton is fully accessible:

- **ARIA roles:** Button carries native semantics via `role="button"` (implicit in `<button>`)
- **Keyboard interaction:**
  - `Enter`: Activates the button (native button behavior)
  - `Space`: Activates the button (native button behavior)
  - Focus ring visible when focused
- **Screen reader:**
  - `[aria-label]` announces the button's purpose
  - Icon is marked `aria-hidden="true"` (decorative)
  - Label text is the primary announcement
- **Focus management:**
  - Button is keyboard focusable
  - Focus ring follows standard browser outline (customizable via CSS)

## Composition

CngxCloseButton is used internally by cngx feedback components:

- **Host directives:** None
- **Combines with:** CngxAlert, CngxToastOutlet, CngxPopoverPanel, any dismissible component
- **Provides:** Consistent close button styling and behavior

### Example: Composition Pattern

```typescript
// Inside a dismissible notification
<div class="notification">
  <span>{{ message }}</span>
  <cngx-close-button label="Dismiss notification" (pressed)="dismiss()" />
</div>

// Inside a dialog
<dialog>
  <h2>{{ title }}</h2>
  <p>{{ content }}</p>
  <div class="actions">
    <button (click)="confirm()">Confirm</button>
    <cngx-close-button label="Close dialog" (pressed)="cancel()" />
  </div>
</dialog>
```

## Styling

CngxCloseButton uses `display: contents` so the host element produces no DOM box — only the inner `<button>` renders.

### Default Styling

Renders an X icon with:

- 32px min size
- 0.5 opacity resting
- Hover: 1 opacity + light background
- Focus: 2px outline with 2px offset
- Active: 0.8 opacity

All properties are customizable via CSS custom properties:

```scss
// Override in your component
cngx-close-button {
  --cngx-close-button-size: 40px;
  --cngx-close-button-color: var(--color-error);
  --cngx-close-button-hover-bg: rgba(255, 0, 0, 0.1);
}
```

### Custom Icon Override

Via `provideFeedback(withCloseIcon(MyIcon))` in `@cngx/ui/feedback`:

```typescript
@Component({
  selector: 'app-custom-close-icon',
  template: `<mat-icon>close</mat-icon>`,
  imports: [MatIconModule],
})
export class CustomCloseIcon {}

// In app setup:
bootstrapApplication(AppComponent, {
  providers: [provideFeedback(withCloseIcon(CustomCloseIcon))],
});
```

## Examples

### Alert with Close Button

```typescript
@Component({
  selector: 'app-alert',
  template: `
    <div role="alert" class="alert">
      <svg class="icon" aria-hidden="true"><!-- icon --></svg>
      <div class="content">
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
      </div>
      <cngx-close-button label="Close alert" (pressed)="onClose()" />
    </div>
  `,
  imports: [CngxCloseButton],
  styles: [`
    .alert {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 4px;
      background: var(--color-alert);
    }

    cngx-close-button {
      --cngx-close-button-color: inherit;
      --cngx-close-button-opacity: 0.6;
    }
  `],
})
export class AlertComponent {
  @Input() title = 'Alert';
  @Input() message = '';
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }
}
```

### Dismissible Card

```typescript
@Component({
  selector: 'app-dismissible-card',
  template: `
    <div class="card">
      <h3>{{ title }}</h3>
      <p>{{ content }}</p>
      <cngx-close-button label="Dismiss" (pressed)="isDismissed.set(true)" />
    </div>
  `,
  imports: [CngxCloseButton],
  styles: [`
    .card {
      position: relative;
      padding: 16px;
      border: 1px solid var(--color-border);
      border-radius: 8px;
    }

    cngx-close-button {
      position: absolute;
      top: 8px;
      right: 8px;
      --cngx-close-button-size: 28px;
      --cngx-close-button-opacity: 0.4;
    }
  `],
})
export class DismissibleCardComponent {
  @Input() title = '';
  @Input() content = '';

  readonly isDismissed = signal(false);
}
```

### Toast with Close Button

```typescript
@Component({
  selector: 'app-toast',
  template: `
    <div class="toast" role="status">
      <span class="message">{{ message }}</span>
      @if (dismissible()) {
        <cngx-close-button label="Dismiss" (pressed)="dismiss()" />
      }
    </div>
  `,
  imports: [CngxCloseButton],
  styles: [`
    .toast {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      background: var(--color-surface);
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    cngx-close-button {
      --cngx-close-button-opacity: 0.5;
      --cngx-close-button-hover-opacity: 1;
    }
  `],
})
export class ToastComponent {
  @Input() message = '';
  @Input() dismissible = signal(true);
  @Output() dismissed = new EventEmitter<void>();

  dismiss() {
    this.dismissed.emit();
  }
}
```

### Custom Icon via Global Provider

```typescript
// In app.config.ts or main.ts

import { provideFeedback, withCloseIcon } from '@cngx/ui/feedback';

@Component({
  selector: 'app-custom-close-icon',
  template: `<i class="icon-times"></i>`,
})
export class CustomCloseIcon {}

export const appConfig: ApplicationConfig = {
  providers: [
    provideFeedback(withCloseIcon(CustomCloseIcon)),
    // ... other providers
  ],
};
```

### Styling with Density

```typescript
// Compact close button
cngx-close-button {
  --cngx-close-button-size: 24px;
  --cngx-close-button-icon-size: 12px;
  --cngx-close-button-padding: 4px;
}

// Large close button
cngx-close-button {
  --cngx-close-button-size: 48px;
  --cngx-close-button-icon-size: 20px;
  --cngx-close-button-padding: 12px;
}
```

### Accessible Label Examples

```typescript
// Context-specific labels
<cngx-close-button label="Close alert" />
<cngx-close-button label="Dismiss notification" />
<cngx-close-button label="Close dialog" />
<cngx-close-button label="Dismiss toast" />
<cngx-close-button label="Remove item" />
```

## Implementation Notes

### Display: Contents

CngxCloseButton uses `display: contents` on the host so the host element contributes no box to the layout:

```scss
:host {
  display: contents;
}
```

This means:
- The inner `<button>` is the only box in the layout
- No extra wrapper padding/margin
- Clean focus ring (no double outline)
- Works with flexbox/grid parents without interference

### Icon Injection

The custom icon is injected via `NgComponentOutlet`:

```typescript
protected readonly customIcon = inject(CNGX_CLOSE_ICON, { optional: true });
```

If a custom icon is provided, it renders instead of the built-in SVG X.

### Built-in Icon

A simple X SVG renders by default:

```xml
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <line x1="18" y1="6" x2="6" y2="18" />
  <line x1="6" y1="6" x2="18" y2="18" />
</svg>
```

This is lightweight and respects the button's color via `currentColor`.

## See Also

- [compodoc API documentation](../../../../../../../docs/modules/CngxCloseButton.html)
- [CngxAlert](../../../../../../ui/feedback/) — Uses CngxCloseButton
- [CngxToastOutlet](../../../../../../ui/feedback/) — Uses CngxCloseButton
- [provideFeedback with withCloseIcon](../../../../../../ui/feedback/) — Global icon override
- Demo: `dev-app/src/app/demos/common/close-button-demo/`
- Tests: `projects/common/interactive/src/close-button/close-button.spec.ts`
