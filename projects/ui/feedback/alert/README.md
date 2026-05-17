# Alert

Inline alert atom with visibility-phase-driven animations, state-driven visibility, auto-dismiss with pause-on-hover/focus, and optional collapsibility.

## Components and Directives

### CngxAlert

Inline alert with enter/exit animations and smart visibility management.

#### Import

```typescript
import { CngxAlert, CngxAlertIcon, CngxAlertAction } from '@cngx/ui/feedback';
```

#### Slot Directives

- `cngxAlertIcon` — Custom icon template (overrides global `withAlertIcons()` config)
- `cngxAlertAction` — Action button/link inside the alert (restricts to `<button>` and `<a>`)

#### Example

```typescript
// Static alert (always visible)
<cngx-alert severity="warning" message="Check your settings" />

// State-driven (shows on error)
readonly saveState = injectAsyncState(() => this.save$);
<cngx-alert [state]="saveState()" title="Save failed">

// Boolean-driven with auto-dismiss
<cngx-alert severity="success" message="Saved!"
            [when]="showSuccess()" [duration]="3000" />

// With custom action
<cngx-alert severity="error" message="Connection lost"
            [duration]="5000">
  <button cngxAlertAction (click)="retry()">Retry</button>
</cngx-alert>

// With custom icon
<cngx-alert severity="info">
  <ng-template cngxAlertIcon>
    <i class="custom-icon"></i>
  </ng-template>
</cngx-alert>
```

#### CSS Custom Properties

- `--cngx-alert-gap` (default `8px`) — Gap between icon and message
- `--cngx-alert-padding` (default `12px 16px`) — Padding inside alert
- `--cngx-alert-border-radius` (default `4px`) — Border radius
- `--cngx-alert-border-color` (default severity-specific) — Border color
- `--cngx-alert-bg` (default severity-specific) — Background color
- `--cngx-alert-color` (default severity-specific) — Text color
- `--cngx-alert-{severity}-bg` — Per-severity background
- `--cngx-alert-{severity}-border` — Per-severity border color
- `--cngx-alert-{severity}-icon` — Per-severity icon color

#### Accessibility

- **ARIA roles**: `role="alert"` for error/warning, `role="status"` for info/success
- **ARIA atomic**: `aria-atomic="false"` when action button present (avoids re-announcing on click)
- **ARIA busy**: `aria-busy` set when state is loading
- **Screen reader**: Alert content is announced automatically on visibility change

---

### CngxAlertStack

Scoped alert stack with optional overflow management.

#### Import

```typescript
import { CngxAlertStack, CngxAlerter } from '@cngx/ui/feedback';
```

#### CSS Custom Properties

- `--cngx-alert-stack-reserve-height` — Minimum height when `reserveSpace=true`

#### Example

```typescript
// Scoped alert stack
<cngx-alert-stack [scope]="'form'">
  <!-- Shows only alerts with scope="form" -->
</cngx-alert-stack>

// With overflow management
<cngx-alert-stack [maxVisible]="3">
  <!-- Shows only 3 alerts at once; older ones collapse -->
</cngx-alert-stack>

// Component accessing the stack
export class MyComponent {
  private readonly alerter = inject(CngxAlerter);

  showError(): void {
    this.alerter.show({
      message: 'Save failed',
      severity: 'error',
      scope: 'form'
    });
  }
}
```

---

### CngxAlerter

Injectable service for programmatic alert control. Scoped via `CngxAlertStack` (not `providedIn: 'root'`).

#### AlertConfig

```typescript
interface AlertConfig {
  message: string;              // Required
  severity?: AlertSeverity;     // Default: 'info'
  title?: string;               // Bold primary text
  persistent?: boolean;          // Default: true (no auto-dismiss)
  duration?: number;            // Auto-dismiss ms (overrides persistent)
  dismissible?: boolean;        // Default: true
  scope?: string;               // Filter key for stack
}
```

#### AlertRef

```typescript
interface AlertRef {
  id: string;
  dismiss(): void;
  afterDismissed(): Observable<void>;
}
```

#### Example

```typescript
export class MyComponent {
  private readonly alerter = inject(CngxAlerter);

  async saveForm(): Promise<void> {
    try {
      await this.api.save(this.formData);
      this.alerter.show({
        message: 'Saved successfully',
        severity: 'success',
        duration: 3000,
        scope: 'form'
      });
    } catch (err) {
      this.alerter.show({
        message: 'Save failed: ' + err.message,
        severity: 'error',
        scope: 'form'
      });
    }
  }
}
```

---

### CngxAlertOn

Declarative directive bridging `CngxAsyncState` changes to alert displays.

#### Import

```typescript
import { CngxAlertOn } from '@cngx/ui/feedback';
```

#### Example

```typescript
readonly deleteState = createAsyncState<void>();

<button [cngxAsyncClick]="deleteAction" [cngxAlertOn]="deleteState()"
        alertSuccess="Deleted successfully"
        alertError="Delete failed"
        alertErrorDetail="true">
  Delete
</button>
```

---

## Accessibility

Alerts follow WCAG 2.1 Level AA:

- **ARIA roles**: Proper roles based on severity (alert/status)
- **SR announcements**: Content announced on visibility change
- **Keyboard navigation**: Dismiss button accessible via Tab
- **Focus management**: Focus not trapped inside alert

---

## Styling

```scss
cngx-alert {
  --cngx-alert-info-bg: #e3f2fd;
  --cngx-alert-info-border: #bbdefb;
  --cngx-alert-success-bg: #e8f5e9;
  --cngx-alert-success-border: #c8e6c9;
  --cngx-alert-warning-bg: #fff3e0;
  --cngx-alert-warning-border: #ffe0b2;
  --cngx-alert-error-bg: #ffebee;
  --cngx-alert-error-border: #ffcdd2;

  // Animation
  &.cngx-alert--entering {
    animation: slideDown 0.2s ease-out;
  }

  &.cngx-alert--exiting {
    animation: slideUp 0.2s ease-in;
  }
}
```

---

## Material Theme

Alert components are themed via the shared `_feedback-theme.scss`:

```scss
@use '@cngx/themes/material/feedback-theme' as feedback;

html {
  @include feedback.theme($theme);
}
```

Sets per-severity colors (`--cngx-alert-{info/success/warning/error}-{bg,border,icon}`), close button density, and animation timing from the Material palette.

---

## See Also

- [CngxBanner](../banner/README.md) — System-level persistent banners
- [CngxToaster](../toast/README.md) — Toast notifications
- Compodoc API documentation: `npm run docs:serve`
