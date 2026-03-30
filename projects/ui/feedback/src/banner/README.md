# Banner

System-level persistent banner notifications that never auto-dismiss. Typically positioned at the top of the app for session timeout, offline status, and critical system messages.

## Components and Directives

### CngxBanner

Injectable service for managing persistent banners. Not `providedIn: 'root'` — must be provided via `provideFeedback(withBanners())`.

#### Import

```typescript
import { CngxBanner } from '@cngx/ui/feedback';
import { provideFeedback, withBanners } from '@cngx/ui/feedback';
```

#### Methods

- `show(config: BannerConfig): void` — Show or upsert a banner (keyed by `id`)
- `update(id: string, patch: Partial<BannerConfig>): void` — Update banner in-place
- `dismiss(id: string): void` — Dismiss a specific banner
- `dismissAll(): void` — Dismiss all banners
- `executeAction(id: string): Promise<void>` — Execute the banner's action handler

#### BannerConfig

```typescript
interface BannerConfig {
  id: string;                    // Required — unique dedup key
  message: string;               // Required — primary message
  severity?: 'info' | 'warning' | 'error'; // Default: 'info'
  action?: {                     // Optional action button
    label: string;
    handler: () => void | Promise<void>;
  };
  dismissible?: boolean;         // Default: true
}
```

#### Example

```typescript
export class MyComponent {
  private readonly banner = inject(CngxBanner);

  ngOnInit(): void {
    // Show persistent banner
    this.banner.show({
      id: 'offline-notice',
      message: 'You are offline',
      severity: 'warning',
      action: {
        label: 'Retry',
        handler: () => this.checkConnection()
      }
    });
  }

  dismiss(): void {
    this.banner.dismiss('offline-notice');
  }

  update(): void {
    this.banner.update('offline-notice', {
      message: 'Back online!'
    });
  }
}
```

---

### CngxBannerOutlet

Outlet component that renders all managed banners. Must be placed once in the app shell (typically above `<router-outlet>`).

#### Import

```typescript
import { CngxBannerOutlet } from '@cngx/ui/feedback';
```

#### Usage

```typescript
// app.component.ts
@Component({
  template: `
    <cngx-banner-outlet></cngx-banner-outlet>
    <router-outlet></router-outlet>
  `,
  imports: [CngxBannerOutlet, RouterOutlet]
})
export class AppComponent {}
```

#### CSS Classes

- `cngx-banner-outlet` — Applied to the host (typically `<div>`)

#### CSS Custom Properties

- `--cngx-banner-z-index` (default `900`) — Stacking context
- `--cngx-banner-gap` (default `8px`) — Gap between banners
- `--cngx-banner-padding` (default `12px 16px`) — Banner padding
- `--cngx-banner-bg` (default severity-specific) — Background color
- `--cngx-banner-color` (default severity-specific) — Text color
- `--cngx-banner-border-color` (default severity-specific) — Border color
- `--cngx-banner-{severity}-{bg,border,icon}` — Per-severity overrides
- `--cngx-banner-enter-duration` (default `300ms`) — Entry animation
- `--cngx-banner-pending-opacity` (default `0.8`) — During action execution
- `--cngx-banner-action-bg` — Action button background
- `--cngx-banner-action-radius` — Action button border radius
- `--cngx-banner-action-padding` — Action button padding

---

### CngxBannerOn

Declarative directive bridging `CngxAsyncState` changes to banner displays.

#### Import

```typescript
import { CngxBannerOn } from '@cngx/ui/feedback';
```

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `state` | `CngxAsyncState<unknown>` | Required | Async state to monitor. |
| `bannerId` | `string` | Required | Banner ID (dedup key). |
| `bannerError` | `string` | Required | Message to show on `error` status. |
| `bannerSeverity` | `'error' \| 'warning'` | `'error'` | Severity level. |
| `bannerErrorDetail` | `boolean` | `false` | Append `error.message` to banner. |

#### Behavior

- Shows banner when state is `error` (if `bannerError` set)
- Dismisses banner when state returns to `idle` or `success`
- Transition-only: never fires on initial `idle` state

#### Example

```typescript
readonly loadState = injectAsyncState(() => this.loadData$);

<div [cngxBannerOn]="loadState()"
     bannerId="load-error"
     bannerError="Failed to load data"
     [bannerErrorDetail]="true"></div>
```

---

### CngxBannerTrigger

Condition-driven banner that requires no service injection. Renders nothing; manages banner lifecycle via input changes.

#### Import

```typescript
import { CngxBannerTrigger } from '@cngx/ui/feedback';
```

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `when` | `boolean` | Required | Condition for showing the banner. |
| `message` | `string` | Required | Banner message. |
| `id` | `string` | Required | Unique banner ID. |
| `severity` | `'info' \| 'warning' \| 'error'` | `'info'` | Severity level. |
| `dismissible` | `boolean` | `true` | Whether the banner can be dismissed. |
| `actionLabel` | `string \| undefined` | `undefined` | Action button label. |
| `actionHandler` | `(() => void) \| undefined` | `undefined` | Action click handler. |

#### Behavior

- Shows banner when `when=true`
- Dismisses banner when component is destroyed
- Does not render any template

#### Example

```typescript
<cngx-banner-trigger [when]="isSessionAboutToExpire()"
                     id="session-expiry"
                     message="Your session expires in 5 minutes"
                     severity="warning"
                     actionLabel="Extend"
                     [actionHandler]="extendSession.bind(this)">
</cngx-banner-trigger>
```

---

## Setup

### Provider

```typescript
import { provideFeedback, withBanners } from '@cngx/ui/feedback';

bootstrapApplication(AppComponent, {
  providers: [
    provideFeedback(withBanners())
  ]
});
```

This provides `CngxBanner` at the environment level for root injection.

---

## Accessibility

Banners are fully WCAG 2.1 Level AA:

- **ARIA live regions**: `aria-live="assertive"` for errors, `"polite"` for others
- **ARIA busy**: Set during action execution
- **Focus management**: Actions are keyboard-accessible
- **SR announcements**: Banner appears and action state changes announced

---

## Common Patterns

### Session Timeout

```typescript
<cngx-banner-trigger [when]="sessionAboutToExpire()"
                     id="session-timeout"
                     message="Your session expires in {{ minutesLeft() }} minutes"
                     severity="warning"
                     actionLabel="Stay logged in"
                     [actionHandler]="refreshSession.bind(this)">
</cngx-banner-trigger>
```

### Offline Status

```typescript
<cngx-banner-trigger [when]="!isOnline()"
                     id="offline"
                     message="No internet connection"
                     severity="error">
</cngx-banner-trigger>
```

### Dismissible Update Notification

```typescript
<cngx-banner-trigger [when]="updateAvailable()"
                     id="app-update"
                     message="A new version is available"
                     severity="info"
                     [dismissible]="true"
                     actionLabel="Reload"
                     [actionHandler]="reloadApp.bind(this)">
</cngx-banner-trigger>
```

### Programmatic Banner Management

```typescript
export class AppComponent implements OnInit {
  private readonly banner = inject(CngxBanner);

  ngOnInit(): void {
    // Monitor connection status
    window.addEventListener('online', () => {
      this.banner.dismiss('offline');
    });

    window.addEventListener('offline', () => {
      this.banner.show({
        id: 'offline',
        message: 'You are offline',
        severity: 'error'
      });
    });
  }
}
```

---

## Styling

```scss
cngx-banner-outlet {
  --cngx-banner-info-bg: #e3f2fd;
  --cngx-banner-info-border: #bbdefb;
  --cngx-banner-warning-bg: #fff3e0;
  --cngx-banner-warning-border: #ffe0b2;
  --cngx-banner-error-bg: #ffebee;
  --cngx-banner-error-border: #ffcdd2;

  // Sticky positioning
  position: sticky;
  top: 0;
  z-index: var(--cngx-banner-z-index, 900);
}
```

---

## See Also

- [CngxAlert](../alert/README.md) — Inline alerts (scoped)
- [CngxToaster](../toast/README.md) — Temporary toast notifications
- [CngxAsyncState](https://github.com/cngxjs/cngx) — Async state management
- Compodoc API documentation: `npm run docs:serve`
