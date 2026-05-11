# Retry with Exponential Backoff

Utility function that wraps an async action with automatic retry logic.

## Import

```typescript
import { withRetry, type RetryState } from '@cngx/common/interactive';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { withRetry } from '@cngx/common/interactive';
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
  private readonly [saveWithRetry, retryState] = withRetry(
    () => this.http.post('/api/save', data),
    { maxAttempts: 3, delay: 1000, backoff: 'exponential' }
  );

  constructor(private http: HttpClient) {}
}
```

## API

### withRetry Function

```typescript
function withRetry(action: AsyncAction, config?: RetryConfig): [AsyncAction, RetryState]
```

Returns a tuple: a wrapped action function and a RetryState object.

#### Parameters

- **action** (AsyncAction) — The async action to wrap. Must return a Promise or Observable.
- **config** (RetryConfig, optional):
  - **maxAttempts** (number, default: 3) — Total attempts including the first
  - **delay** (number, default: 1000) — Base delay in ms between retries
  - **backoff** ('linear' | 'exponential', default: 'exponential') — Retry delay strategy
    - exponential: delay * 2^(attempt - 1)
    - linear: delay * attempt

#### Returns

- **Tuple[0]** (AsyncAction) — The wrapped action with retry logic
- **Tuple[1]** (RetryState) — Read-only state for UI feedback

### RetryState Interface

```typescript
interface RetryState {
  readonly attempt: Signal<number>;          // Current attempt (1-based, 0 before first run)
  readonly maxAttempts: Signal<number>;      // Total attempts allowed
  readonly retrying: Signal<boolean>;        // Waiting for retry delay
  readonly exhausted: Signal<boolean>;       // All attempts exhausted
  readonly lastError: Signal<unknown>;       // Error from last failed attempt
  readonly state: CngxAsyncState<unknown>;   // Full async state view
  reset(): void;                              // Reset state for re-invocation
}
```

#### Signals

- `attempt: Signal<number>` — Current attempt number (1-based). Zero before first invocation. Increments after each failed attempt.
- `maxAttempts: Signal<number>` — Static computed signal; always equals the configured max attempts
- `retrying: Signal<boolean>` — True while waiting for the retry delay before the next attempt. The feedback system maps this to 'pending' status.
- `exhausted: Signal<boolean>` — True after the final attempt fails. Persists until reset() or a new invocation.
- `lastError: Signal<unknown>` — The error value from the most recent failed attempt. Undefined until first failure.
- `state: CngxAsyncState<unknown>` — Full async state view combining all signals. Bind to feedback consumers ([state]="retryState.state").

## Accessibility

withRetry exposes state via RetryState, but has no built-in ARIA:

- **ARIA roles:** None (state is application-specific)
- **Keyboard interaction:** None (the wrapped action handles interaction)
- **Screen reader:**
  - Bind `state` to feedback consumers (CngxToastOn, CngxAlertOn) for announcements
  - Use `attempt()` and `maxAttempts()` to create accessible feedback: "Attempt 2 of 3"
- **Focus management:** None (delegates to the wrapped action)

## Composition

withRetry composes naturally with CngxAsyncClick and the feedback system:

- **Host directives:** None (utility function, not a directive)
- **Combines with:** CngxAsyncClick, CngxActionButton, feedback system (toasts, alerts)
- **Provides:** Wrapped AsyncAction + RetryState for UI feedback

### Example: Composition Pattern

```typescript
// Wrap an HTTP action with retry
const [saveWithRetry, retryState] = withRetry(
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

withRetry provides no styling — it exposes state signals for consumers to style based on:

- `attempt()` — Show which attempt is in progress
- `retrying()` — Show a "retrying..." indicator
- `exhausted()` — Show an error state when all retries are exhausted
- `state.status()` — Use the full async state for complex feedback

## Examples

### Basic Retry with Backoff

```typescript
const [action, state] = withRetry(
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
const [action, state] = withRetry(
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
const [deleteWithRetry, retryState] = withRetry(
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
const [saveWithRetry, retryState] = withRetry(
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
    Exhausted — click to retry
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
const [uploadWithRetry, retryState] = withRetry(
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
const [retryAction, state] = withRetry(
  () => this.http.get('/api/data').pipe(
    map(response => response.data),
    switchMap(data => this.processData(data))
  ),
  { maxAttempts: 3, delay: 1000 }
);

// The wrapped action handles both Promise and Observable
await retryAction();
```

## Implementation Notes

### Generation Counter

withRetry uses a generation counter to cancel in-flight retry loops if the action is invoked again. This prevents stale closures and race conditions in rapid re-invocations.

### Status Mapping

RetryState.status maps to CngxAsyncState:

- **idle** — Before first invocation (attempt === 0)
- **pending** — Waiting for retry delay (retrying() === true)
- **success** — Action succeeded
- **error** — All attempts exhausted (exhausted() === true)

The retrying delay is mapped to 'pending' so the feedback system sees "still working" during waits.

### Error Propagation

The wrapped action throws the error from the final failed attempt. Consumers can catch it:

```typescript
try {
  await saveWithRetry();
} catch (finalError) {
  console.error('All retries failed:', finalError);
}
```

## See Also

- [compodoc API documentation](../../../../../../../docs/modules/withRetry.html)
- [CngxAsyncClick](../async-click/) — The most common consumer of retry actions
- [CngxAsyncState](../../../../../../core/utils/) — The shared state interface
- Demo: `dev-app/src/app/demos/common/retry-demo/`
- Tests: `projects/common/interactive/src/retry/with-retry.spec.ts`
