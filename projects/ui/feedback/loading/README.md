# Loading Feedback

Indicators and overlays for communicating loading and progress states.

## Components

### CngxLoadingIndicator

Animated loading spinner with optional label and delay/minimum duration timing.

#### Import

```typescript
import { CngxLoadingIndicator } from '@cngx/ui/feedback';
```

#### Example

```html
<cngx-loading-indicator 
  [loading]="isLoading()"
  label="Saving…"
  [delay]="100"
  [minDuration]="300" />
```

#### Accessibility

- `role="status"` - Announces loading state to screen readers
- `aria-busy="true"` - Communicates busy state
- `aria-label` - Customizable label



### CngxLoadingOverlay

Full-coverage overlay that blocks interaction and shows a centered spinner during loading.

#### Import

```typescript
import { CngxLoadingOverlay } from '@cngx/ui/feedback';
```

#### Structure

The overlay uses `display: grid` with shared `grid-area: 1/1` - both backdrop and content occupy the same space:

```scss
.overlay {
  display: grid;
  grid-template-areas: 'stack';

  .backdrop {
    grid-area: stack;
  }

  .spinner {
    grid-area: stack;
    z-index: 1;
  }

  .content {
    grid-area: stack;
  }
}
```

#### Focus Management

- On overlay show: saves focused element, moves focus to spinner
- On overlay hide: restores saved focus
- Fallback: if saved element is removed, focuses content wrapper

#### Example

```typescript
readonly state = injectAsyncState(() => this.saveData$);
```

```html
<cngx-loading-overlay [state]="state()">
  <!-- Content here is wrapped and receives [attr.inert] during loading -->
  <form>
    <input />
    <button (click)="save()">Save</button>
  </form>
</cngx-loading-overlay>

// Or with boolean control
<cngx-loading-overlay [loading]="isSaving()">
  Content…
</cngx-loading-overlay>

// First-load only (for progressive enhancement)
<cngx-loading-overlay [state]="state()" [firstLoadOnly]="true">
  Content…
</cngx-loading-overlay>
```

#### Accessibility

- Content receives `[attr.inert]` during loading (no interaction)
- `aria-busy` on spinner
- Focus automatically moved to spinner (then restored)
- Spinner labeled for screen readers



### CngxProgress

Progress bar component for file uploads or long operations.

#### Import

```typescript
import { CngxProgress } from '@cngx/ui/feedback';
```

#### Example

```typescript
readonly uploadState = injectAsyncState(() => this.upload$);
readonly progress = computed(() => this.uploadState().progress() ?? 0);
```

```html
<cngx-progress 
  [value]="progress()"
  label="Uploading…" />

<cngx-progress [indeterminate]="true" label="Processing…" />
```


#### Accessibility

- `role="progressbar"` - Communicates progress purpose
- `aria-valuenow` - Current progress value
- `aria-valuemin="0"` / `aria-valuemax="100"` - Progress range
- `aria-label` - Customizable label



## Timing Control

Both `CngxLoadingIndicator` and `CngxLoadingOverlay` support smart timing:

### Delay

```typescript
[delay]="200"  // Don't show spinner if operation completes in < 200ms
```

### Minimum Duration

```typescript
[minDuration]="500"  // Keep spinner visible for at least 500ms even if data arrives early
```

These prevent the "flash" effect when operations are very fast or very slow.



## Common Patterns

### Loading with Form Submission

```typescript
readonly submitState = createAsyncState<void>();
```
```html
<cngx-loading-overlay [state]="submitState()">
  <form (ngSubmit)="submit()">
    <input [(ngModel)]="data" />
    <button>Submit</button>
  </form>
</cngx-loading-overlay>
```

### File Upload with Progress

```typescript
readonly uploadState = injectAsyncState(() => this.fileUpload$);
```
```html
<cngx-progress 
  [value]="uploadState().progress() ?? 0"
  label="Uploading {{ fileName() }}…" />

<button 
  [disabled]="uploadState().isBusy()"
  (click)="selectFile()">
  Upload
</button>
```

### First-Load Skeleton, Refresh Overlay

```typescript
readonly state = injectAsyncState(() => this.loadData$);
```
```html
<!-- First load shows full skeleton -->
<cngx-loading-overlay [state]="state()" [firstLoadOnly]="true">
  <!-- Content renders, refresh shows light overlay -->
  <div>Data: {{ state().data() }}</div>
</cngx-loading-overlay>
```

### Async Container with Loading Overlay

```typescript
readonly state = injectAsyncState(() => this.loadData$);
```
```html
<cngx-async-container [state]="state()">
  <ng-template cngxAsyncContentTpl let-data>
    <!-- Refresh shows overlay -->
    <cngx-loading-overlay [loading]="state().isRefreshing()">
      <div>{{ data }}</div>
      <button (click)="state.refresh()">Refresh</button>
    </cngx-loading-overlay>
  </ng-template>
</cngx-async-container>
```



## Material Theme

All feedback components share `_feedback-theme.scss`:

```scss
@use '@cngx/themes/material/feedback-theme' as feedback;

html {
  @include feedback.theme($theme);
}
```

Sets loading indicator colors (`--cngx-loading-indicator-color/track`), bar dimensions, overlay backdrop, and close button styling from the Material palette. Includes a `density($level)` mixin for close buttons (0/default, -1/compact, -2/dense).



## See Also

- [CngxAsyncState](https://github.com/cngxjs/cngx) - Async state management
- [CngxAsyncContainer](../async-container/README.md) - Integrated loading UI
- [CngxSkeleton](../../README.md) - Placeholder content during load
