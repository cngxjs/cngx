# Toast

Temporary notification system with auto-dismiss, deduplication, and programmatic or declarative control.

## Components and Services

### CngxToaster

Feature-scoped service for managing toasts. Not `providedIn: 'root'` - must be provided via `provideFeedback(withToasts())` or `provideToasts()`.

#### Import

```typescript
import { CngxToaster } from '@cngx/ui/feedback';
import { provideFeedback, withToasts } from '@cngx/ui/feedback';
```

#### ToastConfig

```typescript
interface ToastConfig {
  message: string;              // Required - main message
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



### CngxToastOutlet

Outlet component that renders the toast stack. Must be placed once in the app shell.

#### Import

```typescript
import { CngxToastOutlet } from '@cngx/ui/feedback';
```

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


### CngxToastOn

Declarative directive bridging `CngxAsyncState` changes to toast displays.

#### Import

```typescript
import { CngxToastOn } from '@cngx/ui/feedback';
```

#### Behavior

- Shows success toast on `success` transition (if `toastSuccess` set)
- Shows error toast on `error` transition (if `toastError` set)
- Transition-only: never fires on initial `idle` state
- Respects dedup window from global config

#### Example

```typescript
readonly deleteState = createAsyncState<void>();
```
```html
<button 
  [cngxAsyncClick]="deleteAction" [cngxToastOn]="deleteState()"
  toastSuccess="Deleted successfully"
  toastError="Delete failed"
  [toastErrorDetail]="true">
  Delete
</button>
```



### CngxToast (Component)

Condition-driven toast trigger that requires no service injection.

#### Import

```typescript
import { CngxToast } from '@cngx/ui/feedback';
```

#### Behavior

- Shows toast when `when` transitions from `false` to `true`
- Does not render any template

#### Example

```html
<cngx-toast [when]="justSaved()" message="Changes saved" severity="success"></cngx-toast>
```



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



## Deduplication

Toasts are deduplicated within a time window (default 1000ms). The dedup key is:

```typescript
key = message + severity + title
```

When an identical toast fires again within the window, the existing toast's count is incremented and the timer restarts. The message displays as "X (2)" after dedup.



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



## Accessibility

- **ARIA live regions**: `aria-live="polite"` for success/info, `"assertive"` for error
- **ARIA atomic**: `aria-atomic="true"` (entire toast announced)
- **Focus management**: Action buttons are keyboard-accessible (Tab)
- **SR announcements**: Toast content announced on appearance



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





## See Also

- [CngxAlert](../alert/README.md) - Inline alerts (scoped, permanent)
- [CngxBanner](../banner/README.md) - System banners (persistent, full-width)
- [CngxActionButton](../../action-button/README.md) - Auto-toast on async action
