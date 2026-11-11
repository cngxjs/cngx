# Retry with Exponential Backoff

Utility function that wraps an async action with automatic retry logic.

## Import

```typescript
import { createRetry, type RetryState } from '@cngx/common/interactive';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { createRetry } from '@cngx/common/interactive';
import { CngxAsyncClick } from '@cngx/common/interactive';

@Component({
  selector: 'app-save',
  template: `
    <button [cngxAsyncClick]="saveWithRetry" #btn="cngxAsyncClick">
      @switch (btn.status()) {
        @case ('pending') {
          Attempt {{ retryState.attempt() }}/{{ retryState.maxAttempts() }}
        }
        @case ('success') { Saved! }
        @case ('error') { All retries exhausted }
        @default { Save }
      }
    </button>
    <div *ngIf="retryState.exhausted()">
      Last error: {{ retryState.lastError() }}
    </div>
  `,
  imports: [CngxAsyncClick],
})
export class SaveComponent {
  private readonly [saveWithRetry, retryState] = createRetry(
    () => this.http.post('/api/save', data),
    { maxAttempts: 3, delay: 1000, backoff: 'exponential' }
  );

  constructor(private http: HttpClient) {}
}
```

## Accessibility

createRetry exposes state via RetryState, but has no built-in ARIA:

- **ARIA roles:** None (state is application-specific)
- **Keyboard interaction:** None (the wrapped action handles interaction)
- **Screen reader:**
  - Bind `state` to feedback consumers (CngxToastOn, CngxAlertOn) for announcements
  - Use `attempt()` and `maxAttempts()` to create accessible feedback: "Attempt 2 of 3"
- **Focus management:** None (delegates to the wrapped action)

## Composition

createRetry composes naturally with CngxAsyncClick and the feedback system:

- **Host directives:** None (utility function, not a directive)
- **Combines with:** CngxAsyncClick, CngxActionButton, feedback system (toasts, alerts)
- **Provides:** Wrapped AsyncAction + RetryState for UI feedback

### Lifetime and cancellation

`createRetry` is a pure factory: it needs no injection context. The lifetime of a run comes from the runner that owns it:

- `cngxAsyncClick` passes an `AbortSignal` to the wrapped action, aborted when the runner is destroyed. On abort the backoff timer is cleared, no further attempt starts and an aborted run settles the retry state idle (`attempt` 0, `retrying` false, `lastError` kept). A run a newer call already superseded writes nothing.
- The library never aborts the in-flight attempt. The signal is forwarded to your action, so passing it on (`fetch(url, { signal })`, an `HttpClient` call ended on the abort event) opts in to cancellation.
- A run that ends without an outcome (superseded by a new call, `reset()`, or aborted) resolves `CNGX_ASYNC_CANCELLED` instead of `undefined`. `cngxAsyncClick` maps it to `idle`: no announcement, no `(settled)`. Compare the result with it where you `await` the action yourself.
- A direct call without a signal (`saveWithRetry()`) has no destroy binding and runs to its end.

```typescript
import { CNGX_ASYNC_CANCELLED, createRetry } from '@cngx/common/interactive';

const [saveWithRetry] = createRetry((signal) => fetch('/api/save', { method: 'POST', signal }));
const result = await saveWithRetry(controller.signal);
if (result === CNGX_ASYNC_CANCELLED) {
  return;
}
```

### Example: Composition Pattern

```typescript
// Wrap an HTTP action with retry
const [saveWithRetry, retryState] = createRetry(
  () => this.http.post('/api/save', data),
  { maxAttempts: 3, delay: 1000, backoff: 'exponential' }
);

// Use with CngxAsyncClick + toast feedback
<button [cngxAsyncClick]="saveWithRetry" #btn="cngxAsyncClick">
  @if (retryState.retrying()) {
    Retrying (attempt {{ retryState.attempt() }})...
  } @else {
    {{ btn.status() === 'success' ? 'Saved!' : 'Save' }}
  }
</button>

<ng-container [cngxToastOn]="retryState.state"
  toastSuccess="Saved after {{ retryState.attempt() }} attempt(s)"
  toastError="Failed after {{ retryState.maxAttempts() }} attempts"
  [toastErrorDetail]="true" />
```

## Styling

createRetry provides no styling - it exposes state signals for consumers to style based on:

- `attempt()` - Show which attempt is in progress
- `retrying()` - Show a "retrying..." indicator
- `exhausted()` - Show an error state when all retries are exhausted
- `state.status()` - Use the full async state for complex feedback

## Examples

### Basic Retry with Backoff

```typescript
const [action, state] = createRetry(
  () => this.http.post('/api/operation', {}),
  { maxAttempts: 3, delay: 1000, backoff: 'exponential' }
);

// Delay progression:
// Attempt 1: fails
// Wait 1000ms → Attempt 2: fails
// Wait 2000ms → Attempt 3: fails → exhausted
```

### Linear Backoff

```typescript
const [action, state] = createRetry(
  () => this.http.get('/api/data'),
  { maxAttempts: 4, delay: 500, backoff: 'linear' }
);

// Delay progression:
// Attempt 1: fails
// Wait 500ms → Attempt 2: fails
// Wait 1000ms → Attempt 3: fails
// Wait 1500ms → Attempt 4: fails → exhausted
```

### With CngxAsyncClick

```typescript
const [deleteWithRetry, retryState] = createRetry(
  () => this.http.delete(`/api/items/${id}`),
  { maxAttempts: 2, delay: 500 }
);

<button [cngxAsyncClick]="deleteWithRetry" #btn="cngxAsyncClick">
  @switch (btn.status()) {
    @case ('pending') {
      @if (retryState.retrying()) {
        Retrying...
      } @else {
        Deleting...
      }
    }
    @case ('success') { Deleted }
    @case ('error') { Delete failed }
    @default { Delete }
  }
</button>
```

### With Toast Notifications

```typescript
const [saveWithRetry, retryState] = createRetry(
  () => this.http.post('/api/save', formData),
  { maxAttempts: 3, delay: 1000 }
);

<button [cngxAsyncClick]="saveWithRetry">Save</button>

<ng-container [cngxToastOn]="retryState.state"
  [toastSuccess]="'Saved on attempt ' + retryState.attempt()"
  toastError="Save failed after all retries"
  [toastErrorDetail]="true" />
```

### Manual Retry Reset

```typescript
<button [cngxAsyncClick]="saveWithRetry" #btn="cngxAsyncClick">
  @if (retryState.exhausted()) {
    Exhausted - click to retry
  } @else {
    {{ btn.status() === 'success' ? 'Saved' : 'Save' }}
  }
</button>

<button (click)="retryState.reset(); saveWithRetry()">
  @if (retryState.exhausted()) {
    Try again
  } @else {
    Reset
  }
</button>
```

### Complex Retry UI

```typescript
const [uploadWithRetry, retryState] = createRetry(
  (file: File) => this.upload(file),
  { maxAttempts: 3, delay: 500, backoff: 'exponential' }
);

<div>
  <button [cngxAsyncClick]="uploadWithRetry">Upload</button>

  @if (retryState.attempt() > 0) {
    <div class="retry-info">
      <span class="label">Attempt {{ retryState.attempt() }} of {{ retryState.maxAttempts() }}</span>

      @if (retryState.retrying()) {
        <span class="status retrying">Retrying in {{ getRetryDelay() }}ms...</span>
      } @else if (retryState.exhausted()) {
        <span class="status error">All {{ retryState.maxAttempts() }} attempts exhausted</span>
      } @else if (retryState.lastError()) {
        <span class="status error">Attempt failed: {{ retryState.lastError() }}</span>
      }
    </div>
  }
</div>
```

### Using Observable Actions

```typescript
const [retryAction, state] = createRetry(
  () => this.http.get('/api/data').pipe(
    map(response => response.data),
    switchMap(data => this.processData(data))
  ),
  { maxAttempts: 3, delay: 1000 }
);

// The wrapped action handles both Promise and Observable
await retryAction();
```

## See Also

- [API on compodocx](../../../../README.md)
- [CngxAsyncClick](../async-click/) - The most common consumer of retry actions
- [CngxAsyncState](../../../core/utils/) - The shared state interface
- Demo: `examples/stories/common/retry-demo/`
- Tests: `projects/common/interactive/retry/with-retry.spec.ts`
