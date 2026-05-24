# Close Button

Shared close/dismiss button molecule for alerts, toasts, and popovers.
Composes the native `<button>` shell with an optional projected icon
and the `CNGX_CLOSE_ICON` DI swap; owns ARIA wiring and the default X
glyph as the projection fallback.

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
      <cngx-close-button label="Close alert" (click)="closeAlert()" />
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

## Accessibility

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
  <cngx-close-button label="Dismiss notification" (click)="dismiss()" />
</div>

// Inside a dialog
<dialog>
  <h2>{{ title }}</h2>
  <p>{{ content }}</p>
  <div class="actions">
    <button (click)="confirm()">Confirm</button>
    <cngx-close-button label="Close dialog" (click)="cancel()" />
  </div>
</dialog>
```

## Styling

CngxCloseButton uses `display: contents` so the host element produces no DOM box - only the inner `<button>` renders.

Consequence: layout properties applied directly to
`<cngx-close-button>` (notably `position: absolute`) are silently
ignored, because elements with `display: contents` do not generate a
principal box. To corner-pin the close button, wrap it in a
positioned element:

```html
<div style="position: relative">
  <!-- card content -->
  <span style="position: absolute; top: 4px; right: 4px">
    <cngx-close-button label="Dismiss card" (click)="dismiss()" />
  </span>
</div>
```

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
      <cngx-close-button label="Close alert" (click)="onClose()" />
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
      <span class="card-close">
        <cngx-close-button
          label="Dismiss saved-successfully card"
          (click)="isDismissed.set(true)" />
      </span>
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

    .card-close {
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
        <cngx-close-button label="Dismiss" (click)="dismiss()" />
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

## See Also

- [API on compodocx](https://cngxjs.github.io/cngx/)
- [CngxAlert](../../../ui/feedback/) - Uses CngxCloseButton
- [CngxToastOutlet](../../../ui/feedback/) - Uses CngxCloseButton
- [provideFeedback with withCloseIcon](../../../ui/feedback/) - Global icon override
- Demo: `examples/stories/common/interactive/close-button/`
- Tests: `projects/common/interactive/close-button/close-button.spec.ts`
