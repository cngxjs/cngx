# Loading Feedback

Indicators and overlays for communicating loading and progress states.

## Components

### CngxLoadingIndicator

Animated loading spinner with optional label and delay/minimum duration timing.

#### Import

```typescript
import { CngxLoadingIndicator } from '@cngx/ui/feedback';
```

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `loading` | `boolean` | `false` | Whether to show the spinner. |
| `label` | `string` | `'Loading'` | SR label for the spinner. |
| `delay` | `number` | `200` | Delay in ms before showing (prevents flash on fast operations). |
| `minDuration` | `number` | `500` | Minimum visible duration in ms (prevents flicker). |

#### Example

```typescript
<cngx-loading-indicator [loading]="isLoading()"
                        label="Saving…"
                        [delay]="100"
                        [minDuration]="300">
</cngx-loading-indicator>
```

#### Accessibility

- `role="status"` — Announces loading state to screen readers
- `aria-busy="true"` — Communicates busy state
- `aria-label` — Customizable label

---

### CngxLoadingOverlay

Full-coverage overlay that blocks interaction and shows a centered spinner during loading.

#### Import

```typescript
import { CngxLoadingOverlay } from '@cngx/ui/feedback';
```

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `state` | `CngxAsyncState<unknown> \| undefined` | `undefined` | Async state controlling visibility. `isBusy()` shows the overlay. |
| `loading` | `boolean` | `false` | Boolean fallback when `state` is not set. |
| `label` | `string` | `'Loading'` | SR label. |
| `delay` | `number` | `200` | Delay before showing (ms). |
| `minDuration` | `number` | `500` | Minimum visible duration (ms). |
| `firstLoadOnly` | `boolean` | `false` | Only show on `isFirstLoad()` (not on refreshes). |

#### Structure

The overlay uses `display: grid` with shared `grid-area: 1/1` — both backdrop and content occupy the same space:

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

#### CSS Custom Properties

- `--cngx-loading-overlay-z-index` (default `10`) — Stacking context
- `--cngx-loading-overlay-backdrop-bg` (default `rgba(255,255,255,0.5)`) — Backdrop color
- `--cngx-loading-overlay-backdrop-opacity` (default `1`) — Backdrop opacity
- `--cngx-overlay-transition-duration` (default `300ms`) — Transition timing
- `--cngx-overlay-transition-easing` (default `ease-out`) — Easing function

#### Accessibility

- Content receives `[attr.inert]` during loading (no interaction)
- `aria-busy` on spinner
- Focus automatically moved to spinner (then restored)
- Spinner labeled for screen readers

---

### CngxProgress

Progress bar component for file uploads or long operations.

#### Import

```typescript
import { CngxProgress } from '@cngx/ui/feedback';
```

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `value` | `number` | `0` | Progress value 0–100 (%). |
| `indeterminate` | `boolean` | `false` | Show indeterminate progress (animated bar, no % value). |
| `label` | `string \| undefined` | `undefined` | Optional label above the bar. |

#### Example

```typescript
readonly uploadState = injectAsyncState(() => this.upload$);
readonly progress = computed(() => this.uploadState().progress() ?? 0);

<cngx-progress [value]="progress()"
               label="Uploading…">
</cngx-progress>

<cngx-progress [indeterminate]="true" label="Processing…"></cngx-progress>
```

#### CSS Custom Properties

- `--cngx-progress-color` (default `#1976d2`) — Bar color
- `--cngx-progress-height` (default `4px`) — Bar height
- `--cngx-progress-transition-duration` (default `300ms`) — Value change transition

#### Accessibility

- `role="progressbar"` — Communicates progress purpose
- `aria-valuenow` — Current progress value
- `aria-valuemin="0"` / `aria-valuemax="100"` — Progress range
- `aria-label` — Customizable label

---

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

---

## Common Patterns

### Loading with Form Submission

```typescript
readonly submitState = createAsyncState<void>();

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

<cngx-progress [value]="uploadState().progress() ?? 0"
               label="Uploading {{ fileName() }}…">
</cngx-progress>

<button [disabled]="uploadState().isBusy()"
        (click)="selectFile()">
  Upload
</button>
```

### First-Load Skeleton, Refresh Overlay

```typescript
readonly state = injectAsyncState(() => this.loadData$);

<!-- First load shows full skeleton -->
<cngx-loading-overlay [state]="state()" [firstLoadOnly]="true">
  <!-- Content renders, refresh shows light overlay -->
  <div>Data: {{ state().data() }}</div>
</cngx-loading-overlay>
```

### Async Container with Loading Overlay

```typescript
readonly state = injectAsyncState(() => this.loadData$);

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

---

## Styling

```scss
cngx-loading-indicator {
  --cngx-spin-duration: 2s;
  --cngx-spin-easing: linear;
}

cngx-loading-overlay {
  --cngx-loading-overlay-backdrop-bg: rgba(0, 0, 0, 0.1);
  --cngx-overlay-transition-duration: 200ms;
}

cngx-progress {
  --cngx-progress-color: #4caf50;
  --cngx-progress-height: 6px;
}
```

---

## Material Theme

All feedback components share `_feedback-theme.scss`:

```scss
@use '@cngx/ui/feedback/feedback-theme' as feedback;

html {
  @include feedback.theme($theme);
}
```

Sets loading indicator colors (`--cngx-loading-indicator-color/track`), bar dimensions, overlay backdrop, and close button styling from the Material palette. Includes a `density($level)` mixin for close buttons (0/default, -1/compact, -2/dense).

---

## See Also

- [CngxAsyncState](https://github.com/cngxjs/cngx) — Async state management
- [CngxAsyncContainer](../async-container/README.md) — Integrated loading UI
- [CngxSkeleton](../../README.md) — Placeholder content during load
- Compodoc API documentation: `npm run docs:serve`
