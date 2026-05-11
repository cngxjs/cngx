# Alert

Inline alert atom with visibility-phase-driven animations, state-driven visibility, auto-dismiss with pause-on-hover/focus, and optional collapsibility.

## Components and Directives

### CngxAlert

Inline alert with enter/exit animations and smart visibility management.

#### Import

```typescript
import { CngxAlert, CngxAlertIcon, CngxAlertAction } from '@cngx/ui/feedback';
```

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `severity` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | Visual severity level — determines icon, color, and ARIA role. |
| `title` | `string \| undefined` | `undefined` | Bold primary text rendered before the message. |
| `message` | `string` | `''` | Alert message text. |
| `state` | `CngxAsyncState<unknown> \| undefined` | `undefined` | Bind an async state — shows when status is `error`/`success`/`loading`, hides on `idle`. Takes precedence over `[when]`. |
| `when` | `boolean` | `true` | Boolean-driven visibility (state-driven alert takes precedence). |
| `duration` | `number \| undefined` | `undefined` | Auto-dismiss after N milliseconds. `undefined` = never auto-dismiss. Pauses on hover/focus. |
| `collapsible` | `boolean` | `false` | Whether the alert can be collapsed/expanded. |
| `collapsed` | `boolean` | `false` | Whether the alert is in collapsed state. Applies `[collapsed]` class. |

#### Signals (read-only)

- `visibilityPhase: Signal<'hidden' \| 'entering' \| 'visible' \| 'exiting'>` — Current visibility animation phase (drives CSS animations)

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

#### CSS Classes

| Class | When Applied |
|-|-|
| `cngx-alert--info` | `severity="info"` |
| `cngx-alert--success` | `severity="success"` |
| `cngx-alert--warning` | `severity="warning"` |
| `cngx-alert--error` | `severity="error"` |
| `cngx-alert--hidden` | Visibility phase `hidden` |
| `cngx-alert--entering` | Visibility phase `entering` |
| `cngx-alert--visible` | Visibility phase `visible` |
| `cngx-alert--exiting` | Visibility phase `exiting` |
| `cngx-alert--collapsible` | `collapsible=true` |
| `cngx-alert--collapsed` | `collapsed=true` |

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

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `scope` | `string \| undefined` | `undefined` | Filter alerts by scope key. When set, only alerts with matching scope are shown. |
| `reserveSpace` | `boolean` | `false` | Set minimum height (`--cngx-alert-stack-reserve-height`) to reserve space. |
| `maxVisible` | `number \| undefined` | `undefined` | Maximum visible alerts. Older alerts collapse into a "+ N more" button when exceeded. |

#### CSS Classes

- `cngx-alert-stack` — Applied to the host

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

#### Signals (read-only)

- `alerts: Signal<readonly AlertState[]>` — Current alerts in the stack

#### Methods

- `show(config: AlertConfig): AlertRef` — Show an alert; returns handle for manual dismiss
- `dismiss(id: string): void` — Dismiss alert by ID
- `dismissAll(scope?: string): void` — Dismiss all alerts, optionally filtered by scope

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

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `state` | `CngxAsyncState<unknown>` | Required | Async state to monitor for transitions. |
| `alertSuccess` | `string \| undefined` | `undefined` | Message to show on `success` transition. |
| `alertError` | `string \| undefined` | `undefined` | Message to show on `error` transition. |
| `alertErrorDetail` | `boolean` | `false` | Append `error.message` to the alert body. |
| `alertScope` | `string \| undefined` | `undefined` | Scope for the alert (matches `CngxAlertStack` scope). |

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
@use '@cngx/ui/feedback/feedback-theme' as feedback;

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
