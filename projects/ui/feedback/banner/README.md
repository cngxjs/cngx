# Banner

System-level persistent banner notifications that never auto-dismiss. Typically positioned at the top of the app for session timeout, offline status, and critical system messages.

## Components and Directives

### CngxBanner

Injectable service for managing persistent banners. Not `providedIn: 'root'` - must be provided via `provideFeedback(withBanners())`.

#### Import

```typescript
import { CngxBanner } from '@cngx/ui/feedback';
import { provideFeedback, withBanners } from '@cngx/ui/feedback';
```

#### BannerConfig

```typescript
interface BannerConfig {
  id: string;                    // Required - unique dedup key
  message: string;               // Required - primary message
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

### CngxBannerOn

Declarative directive bridging `CngxAsyncState` changes to banner displays.

#### Import

```typescript
import { CngxBannerOn } from '@cngx/ui/feedback';
```

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



### CngxBannerTrigger

Condition-driven banner that requires no service injection. Renders nothing; manages banner lifecycle via input changes.

#### Import

```typescript
import { CngxBannerTrigger } from '@cngx/ui/feedback';
```

#### Behavior

- Shows banner when `when=true`
- Dismisses banner when component is destroyed
- Does not render any template

#### Example

```html
<cngx-banner-trigger 
  [when]="isSessionAboutToExpire()"
  id="session-expiry"
  message="Your session expires in 5 minutes"
  severity="warning"
  actionLabel="Extend"
  [actionHandler]="extendSession.bind(this)" />
```



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



## Accessibility

- **ARIA live regions**: `aria-live="assertive"` for errors, `"polite"` for others
- **ARIA busy**: Set during action execution
- **Focus management**: Actions are keyboard-accessible
- **SR announcements**: Banner appears and action state changes announced



## Common Patterns

### Session Timeout

```html
<cngx-banner-trigger 
  [when]="sessionAboutToExpire()"
  id="session-timeout"
  message="Your session expires in {{ minutesLeft() }} minutes"
  severity="warning"
  actionLabel="Stay logged in"
  [actionHandler]="refreshSession.bind(this)" />
```

### Offline Status

```html
<cngx-banner-trigger 
  [when]="!isOnline()"
  id="offline"
  message="No internet connection"
  severity="error" />
```

### Dismissible Update Notification

```html
<cngx-banner-trigger 
  [when]="updateAvailable()"
  id="app-update"
  message="A new version is available"
  severity="info"
  [dismissible]="true"
  actionLabel="Reload"
  [actionHandler]="reloadApp.bind(this)" />
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


## See Also

- [CngxAlert](../alert/README.md) - Inline alerts (scoped)
- [CngxToaster](../toast/README.md) - Temporary toast notifications
- [CngxAsyncState](https://github.com/cngxjs/cngx) - Async state management

