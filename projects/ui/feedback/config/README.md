# Feedback Configuration

Global configuration system for all feedback components via `provideFeedback()` and feature functions.

## Setup

### Provider

```typescript
import { provideFeedback, withToasts, withAlerts, withBanners } from '@cngx/ui/feedback';

bootstrapApplication(AppComponent, {
  providers: [
    provideFeedback(
      withToasts({ defaultDuration: 5000, dedupWindow: 1000 }),
      withAlerts({ defaultDuration: 3000, maxVisible: 5 }),
      withBanners()
    )
  ]
});
```

---

## Feature Functions

### withToasts()

Enables the global toast system with optional configuration.

```typescript
withToasts({
  defaultDuration?: number;  // Default auto-dismiss (ms), default 3000
  dedupWindow?: number;      // Dedup window (ms), default 1000
})
```

#### What it provides

- `CngxToaster` at environment level
- Toast configuration defaults
- Global dedup window

#### Usage

```typescript
const toaster = inject(CngxToaster);
toaster.show({ message: 'Hello' });
```

---

### withAlerts()

Provides `CngxAlerter` at the environment level for root injection. Without this, `CngxAlerter` is only available via `CngxAlertStack`.

```typescript
withAlerts({
  defaultDuration?: number;  // Default auto-dismiss (ms)
  dedupWindow?: number;      // Dedup window (ms), default 1000
  maxVisible?: number;       // Global max alerts
})
```

#### What it provides

- `CngxAlerter` at environment level (root injection)
- Alert configuration defaults
- Global dedup window

#### Usage

```typescript
const alerter = inject(CngxAlerter);
alerter.show({ message: 'Error', severity: 'error' });
```

#### Note

Without this provider, use `CngxAlertStack` to create a scoped alerter:

```typescript
<cngx-alert-stack>
  <!-- CngxAlerter available to children only -->
</cngx-alert-stack>
```

---

### withBanners()

Provides `CngxBanner` at the environment level. Required for `CngxBannerOutlet` and `CngxBannerTrigger`.

```typescript
withBanners()
```

#### What it provides

- `CngxBanner` at environment level (root injection)

#### Usage

```typescript
const banner = inject(CngxBanner);
banner.show({ id: 'offline', message: 'You are offline' });
```

---

### withSpinnerTemplate()

Replace the built-in SVG spinner with a custom component.

```typescript
withSpinnerTemplate(CustomSpinnerComponent)
```

The custom component receives **no inputs** — styling is entirely via CSS custom properties.

#### Example

```typescript
import { provideFeedback, withSpinnerTemplate } from '@cngx/ui/feedback';

@Component({
  selector: 'app-spinner',
  template: `<div class="spinner"></div>`,
  styles: [`
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--cngx-spinner-color, #ddd);
      border-top-color: var(--cngx-spinner-active-color, #1976d2);
      border-radius: 50%;
      animation: spin var(--cngx-spin-duration, 2s) linear infinite;
    }
  `]
})
class CustomSpinnerComponent {}

bootstrapApplication(AppComponent, {
  providers: [
    provideFeedback(withSpinnerTemplate(CustomSpinnerComponent))
  ]
});
```

---

### withAlertIcons()

Replace built-in SVG icons for specific severities.

```typescript
withAlertIcons({
  info?: Type<unknown>;
  success?: Type<unknown>;
  warning?: Type<unknown>;
  error?: Type<unknown>;
})
```

Unspecified severities keep built-in SVG icons.

#### Example

```typescript
import { provideFeedback, withAlertIcons } from '@cngx/ui/feedback';

@Component({
  selector: 'app-check-icon',
  template: `<svg>…</svg>`
})
class CheckIconComponent {}

bootstrapApplication(AppComponent, {
  providers: [
    provideFeedback(
      withAlertIcons({
        success: CheckIconComponent,
        error: ErrorIconComponent
      })
    )
  ]
});
```

#### Per-Instance Override

Override global icons for specific alerts:

```typescript
<cngx-alert severity="success">
  <ng-template cngxAlertIcon>
    <i class="custom-check"></i>
  </ng-template>
</cngx-alert>
```

---

### withCloseIcon()

Replace the built-in X icon in all close/dismiss buttons globally.

```typescript
withCloseIcon(CustomCloseIconComponent)
```

The close button receives the `CNGX_CLOSE_ICON` token for custom styling.

#### Example

```typescript
import { provideFeedback, withCloseIcon } from '@cngx/ui/feedback';

@Component({
  selector: 'app-close-icon',
  template: `<span>×</span>`
})
class CloseIconComponent {}

bootstrapApplication(AppComponent, {
  providers: [
    provideFeedback(withCloseIcon(CloseIconComponent))
  ]
});
```

---

### withLoadingDefaults()

Set default timing for all loading indicators globally.

```typescript
withLoadingDefaults({
  delay?: number;        // Default delay (ms)
  minDuration?: number;  // Default minimum duration (ms)
})
```

Per-instance inputs still override.

#### Example

```typescript
bootstrapApplication(AppComponent, {
  providers: [
    provideFeedback(
      withLoadingDefaults({
        delay: 150,
        minDuration: 400
      })
    )
  ]
});

// All indicators use these defaults
<cngx-loading-indicator [loading]="true"></cngx-loading-indicator>

// Override per instance
<cngx-loading-indicator [loading]="true" [delay]="0"></cngx-loading-indicator>
```

---

## CSS Custom Properties

Global animation and styling configuration via CSS:

### Spinner

- `--cngx-spin-duration` (default `2s`) — Rotation duration
- `--cngx-spin-easing` (default `linear`) — Rotation easing

### Progress Bar

- `--cngx-progress-transition-duration` (default `300ms`) — Value change transition
- `--cngx-progress-easing` (default `ease-out`) — Value change easing

### Toast / Alert / Banner

- `--cngx-toast-enter-duration` (default `200ms`) — Slide-in animation
- `--cngx-overlay-transition-duration` (default `300ms`) — Overlay fade
- `--cngx-overlay-transition-easing` (default `ease-out`) — Overlay easing

#### Example

```scss
:root {
  --cngx-spin-duration: 1.5s;
  --cngx-progress-transition-duration: 500ms;
  --cngx-toast-enter-duration: 100ms;
}
```

---

## Material 3 Theme Integration

All feedback components support Material 3 themes via `_feedback-theme.scss`:

```typescript
import { theme } from '@cngx/ui/feedback/material';

// In your theme file
@include theme($your-m3-theme);
```

### Density

```typescript
@include density($level);
// $level: 0 (default), -1 (compact), -2 (dense)
```

---

## Component Access to Config

Components inject the global config:

```typescript
import { CNGX_FEEDBACK_CONFIG } from '@cngx/ui/feedback';

@Component(...)
export class MyComponent {
  private readonly config = inject(CNGX_FEEDBACK_CONFIG, { optional: true });

  someMethod(): void {
    const duration = this.config?.defaultDuration ?? 3000;
  }
}
```

---

## Full Example

```typescript
import {
  provideFeedback,
  withToasts,
  withAlerts,
  withBanners,
  withSpinnerTemplate,
  withAlertIcons,
  withLoadingDefaults
} from '@cngx/ui/feedback';

bootstrapApplication(AppComponent, {
  providers: [
    provideFeedback(
      withToasts({
        defaultDuration: 4000,
        dedupWindow: 2000
      }),
      withAlerts({
        defaultDuration: 5000,
        maxVisible: 3
      }),
      withBanners(),
      withSpinnerTemplate(CustomSpinnerComponent),
      withAlertIcons({
        success: CheckIconComponent,
        error: ErrorIconComponent
      }),
      withCloseIcon(CustomCloseIconComponent),
      withLoadingDefaults({
        delay: 100,
        minDuration: 300
      })
    )
  ]
});
```

---

## See Also

- [CngxAlert](../alert/README.md) — Inline alerts
- [CngxBanner](../banner/README.md) — System banners
- [CngxToaster](../toast/README.md) — Toasts
- [CngxLoadingIndicator](../loading/README.md) — Loading spinners
- Compodoc API documentation: `npm run docs:serve`
