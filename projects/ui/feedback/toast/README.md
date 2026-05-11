# Toast

Temporary notification system with auto-dismiss, deduplication, and programmatic or declarative control.

## Components and Services

### CngxToaster

Feature-scoped service for managing toasts. Not `providedIn: 'root'` — must be provided via `provideFeedback(withToasts())` or `provideToasts()`.

#### Import

```typescript
import { CngxToaster } from '@cngx/ui/feedback';
import { provideFeedback, withToasts } from '@cngx/ui/feedback';
```

#### Methods

- `show(config: ToastConfig): ToastRef` — Show a toast; returns handle for programmatic dismiss
- `dismissAll(): void` — Dismiss all toasts

#### Signals (read-only)

- `toasts: Signal<readonly ToastState[]>` — Current visible toasts

#### ToastConfig

```typescript
interface ToastConfig {
  message: string;              // Required — main message
  title?: string;               // Bold primary text (enables 2-line layout)
  description?: string;         // Secondary text (below title or fallback for message)
  severity?: AlertSeverity;     // 'info' | 'success' | 'warning' | 'error'
  duration?: number | 'persistent'; // ms or 'persistent' (no auto-dismiss)
  action?: {                    // Optional action button
    label: string;
    handler: () => void;
  };
  dismissible?: boolean;        // Default: true
  content?: Type<unknown>;      // Custom component (replaces message/description)
  contentInputs?: Record<string, unknown>; // Inputs for content component
}
```

#### ToastRef

```typescript
interface ToastRef {
  dismiss(): void;              // Programmatically dismiss
  afterDismissed(): Observable<void>; // Emits when fully removed
}
```

#### Example

```typescript
export class MyComponent {
  private readonly toaster = inject(CngxToaster);

  saveData(): void {
    this.api.save(this.data).subscribe({
      next: () => {
        this.toaster.show({
          message: 'Saved successfully',
          severity: 'success',
          duration: 3000
        });
      },
      error: (err) => {
        this.toaster.show({
          title: 'Save failed',
          description: err.message,
          severity: 'error',
          duration: 5000,
          action: {
            label: 'Retry',
            handler: () => this.saveData()
          }
        });
      }
    });
  }
}
```

---

### CngxToastOutlet

Outlet component that renders the toast stack. Must be placed once in the app shell.

#### Import

```typescript
import { CngxToastOutlet } from '@cngx/ui/feedback';
```

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `position` | `ToastPosition` | `'bottom-end'` | Viewport position: `'top-start'`, `'top-center'`, `'top-end'`, `'bottom-start'`, `'bottom-center'`, `'bottom-end'` |
| `maxVisible` | `number` | `3` | Maximum simultaneous toasts. Oldest evicted when limit exceeded. |
| `insertPosition` | `'start' \| 'end'` | `'start'` | Stack order: `'start'` (newest at top), `'end'` (newest at bottom) |

#### Usage

```typescript
// app.component.ts
@Component({
  template: `
    <cngx-toast-outlet position="top-end" [maxVisible]="4"></cngx-toast-outlet>
    <router-outlet></router-outlet>
  `,
  imports: [CngxToastOutlet, RouterOutlet]
})
export class AppComponent {}
```

#### CSS Classes

- `cngx-toast-outlet` — Applied to the host
- `cngx-toast-outlet--top-start`, `--top-center`, `--top-end` — Position classes
- `cngx-toast-outlet--bottom-start`, `--bottom-center`, `--bottom-end`

#### CSS Custom Properties

- `--cngx-toast-outlet-padding` (default `16px`) — Distance from viewport edge
- `--cngx-toast-gap` (default `8px`) — Gap between toasts
- `--cngx-toast-max-width` (default `400px`) — Toast width

---

### CngxToastOn

Declarative directive bridging `CngxAsyncState` changes to toast displays.

#### Import

```typescript
import { CngxToastOn } from '@cngx/ui/feedback';
```

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `state` | `CngxAsyncState<unknown>` | Required | Async state to monitor for transitions. |
| `toastSuccess` | `string \| undefined` | `undefined` | Message to show on `success` transition. |
| `toastError` | `string \| undefined` | `undefined` | Message to show on `error` transition. |
| `toastErrorDetail` | `boolean` | `false` | Append `error.message` to toast body. |
| `toastSuccessDuration` | `number` | `3000` | Auto-dismiss duration for success toasts (ms). |
| `toastErrorDuration` | `number \| 'persistent'` | `'persistent'` | Auto-dismiss duration for error toasts. |

#### Behavior

- Shows success toast on `success` transition (if `toastSuccess` set)
- Shows error toast on `error` transition (if `toastError` set)
- Transition-only: never fires on initial `idle` state
- Respects dedup window from global config

#### Example

```typescript
readonly deleteState = createAsyncState<void>();

<button [cngxAsyncClick]="deleteAction" [cngxToastOn]="deleteState()"
        toastSuccess="Deleted successfully"
        toastError="Delete failed"
        [toastErrorDetail]="true">
  Delete
</button>
```

---

### CngxToast (Component)

Condition-driven toast trigger that requires no service injection.

#### Import

```typescript
import { CngxToast } from '@cngx/ui/feedback';
```

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `when` | `boolean` | Required | Condition for showing the toast. Rising-edge trigger (false→true). |
| `message` | `string` | Required | Toast message. |
| `title` | `string \| undefined` | `undefined` | Bold primary text. |
| `severity` | `AlertSeverity` | `'info'` | Severity level. |
| `duration` | `number \| 'persistent'` | Severity default | Auto-dismiss duration. |

#### Behavior

- Shows toast when `when` transitions from `false` to `true`
- Does not render any template

#### Example

```typescript
<cngx-toast [when]="justSaved()" message="Changes saved" severity="success"></cngx-toast>
```

---

## Setup

### Provider

```typescript
import { provideFeedback, withToasts } from '@cngx/ui/feedback';

bootstrapApplication(AppComponent, {
  providers: [
    provideFeedback(
      withToasts({
        defaultDuration: 5000,   // Default auto-dismiss (ms)
        dedupWindow: 1000        // Dedup window (ms)
      })
    )
  ]
});
```

---

## Deduplication

Toasts are deduplicated within a time window (default 1000ms). The dedup key is:

```typescript
key = message + severity + title
```

When an identical toast fires again within the window, the existing toast's count is incremented and the timer restarts. The message displays as "X (2)" after dedup.

---

## Behavior

### Auto-Dismiss

- Success toasts: default 3000ms (configurable)
- Error toasts: default `'persistent'` (manual dismiss only)
- Info/warning: configurable per toast
- Timer pauses on `pointerenter` / `focusin`, resumes on `pointerleave` / `focusout`

### Overflow

- When `maxVisible` is exceeded, oldest toast is evicted
- Evicted toast's `afterDismissed()` subject still emits
- New toasts insert at the beginning or end (controlled by `insertPosition`)

---

## Accessibility

Toasts are fully WCAG 2.1 Level AA:

- **ARIA live regions**: `aria-live="polite"` for success/info, `"assertive"` for error
- **ARIA atomic**: `aria-atomic="true"` (entire toast announced)
- **Focus management**: Action buttons are keyboard-accessible (Tab)
- **SR announcements**: Toast content announced on appearance

---

## Common Patterns

### Success Toast

```typescript
this.toaster.show({
  message: 'Saved',
  severity: 'success',
  duration: 3000
});
```

### Error Toast with Action

```typescript
this.toaster.show({
  title: 'Connection Error',
  description: 'Failed to reach server',
  severity: 'error',
  duration: 'persistent',
  action: {
    label: 'Retry',
    handler: () => this.reconnect()
  }
});
```

### Multi-Line Toast with Custom Content

```typescript
this.toaster.show({
  title: 'Upload complete',
  description: '5 files uploaded',
  severity: 'success',
  content: UploadResultComponent,
  contentInputs: { files: this.uploadedFiles }
});
```

### Auto-Dismiss After Action

```typescript
const ref = this.toaster.show({
  message: 'Processing…',
  duration: 'persistent'
});

this.process().subscribe(() => {
  ref.dismiss();
  this.toaster.show({ message: 'Done', severity: 'success' });
});
```

---

## Styling

```scss
cngx-toast-outlet {
  // Position presets
  &.cngx-toast-outlet--top-end {
    top: 0;
    right: 0;
  }

  &.cngx-toast-outlet--bottom-end {
    bottom: 0;
    right: 0;
  }
}

cngx-toast {
  --cngx-toast-info-bg: #e3f2fd;
  --cngx-toast-info-border: #bbdefb;
  --cngx-toast-success-bg: #e8f5e9;
  --cngx-toast-success-border: #c8e6c9;
  --cngx-toast-warning-bg: #fff3e0;
  --cngx-toast-warning-border: #ffe0b2;
  --cngx-toast-error-bg: #ffebee;
  --cngx-toast-error-border: #ffcdd2;

  // Animations
  &.cngx-toast--entering {
    animation: slideUp 0.3s ease-out;
  }

  &.cngx-toast--exiting {
    animation: slideDown 0.2s ease-in;
  }
}
```

---

## See Also

- [CngxAlert](../alert/README.md) — Inline alerts (scoped, permanent)
- [CngxBanner](../banner/README.md) — System banners (persistent, full-width)
- [CngxActionButton](../../action-button/README.md) — Auto-toast on async action
- Compodoc API documentation: `npm run docs:serve`
