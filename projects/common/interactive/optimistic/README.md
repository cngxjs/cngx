# Optimistic Updates

Utility function that creates optimistic update behavior for signals.

## Import

```typescript
import { optimistic, type OptimisticState } from '@cngx/common/interactive';
```

## Quick Start

```typescript
import { Component, signal } from '@angular/core';
import { optimistic } from '@cngx/common/interactive';

@Component({
  selector: 'app-profile',
  template: `
    <input [value]="name()" (change)="updateName($event.target.value)" />
    @if (optimisticState.rolledBack()) {
      <span class="error">Reverted — server rejected the change</span>
    }
  `,
})
export class ProfileComponent {
  readonly name = signal('Alice');

  private readonly [updateName, optimisticState] = optimistic(
    this.name,
    (name) => this.http.put('/api/name', { name })
  );

  constructor(private http: HttpClient) {}
}
```

## API

### optimistic Function

```typescript
function optimistic<T>(
  current: WritableSignal<T>,
  action: (value: T) => Observable<T>
): [(newValue: T) => void, OptimisticState]
```

Returns a tuple: an apply function and an OptimisticState object.

#### Parameters

- **current** (WritableSignal\<T\>) — The writable signal to update optimistically
- **action** ((value: T) => Observable\<T\>) — Async action that confirms the value. Must return an Observable that emits the confirmed value (or error).

#### Returns

- **Tuple[0]** ((newValue: T) => void) — Function to apply the optimistic update
- **Tuple[1]** (OptimisticState) — State for UI feedback

### OptimisticState Interface

```typescript
interface OptimisticState {
  readonly rolledBack: Signal<boolean>;       // Whether rollback occurred on last invocation
  readonly error: Signal<unknown>;            // Error from the failed action
  readonly state: CngxAsyncState<unknown>;    // Full async state view
}
```

#### Signals

- `rolledBack: Signal<boolean>` — True when the last action failed and the value was rolled back. Resets to false on the next invocation.
- `error: Signal<unknown>` — The error from the failed action. Undefined on success or before any action.
- `state: CngxAsyncState<unknown>` — Full async state view combining all signals. Maps:
  - 'pending' while confirming
  - 'success' on confirmation
  - 'error' on rollback

## Accessibility

optimistic provides state signals but has no built-in ARIA:

- **ARIA roles:** None (state is application-specific)
- **Keyboard interaction:** None (the input or control handles interaction)
- **Screen reader:**
  - Bind `state` to feedback consumers for error announcements
  - Announce rollback via aria-live region: "Changes were reverted"
- **Focus management:** None

## Composition

optimistic composes with any signal and can integrate with the feedback system:

- **Host directives:** None (utility function, not a directive)
- **Combines with:** Form controls, feedback system (toasts, alerts)
- **Provides:** Optimistic update function + OptimisticState

### Example: Composition Pattern

```typescript
readonly count = signal(0);
private readonly [incrementCount, countState] = optimistic(
  this.count,
  (newValue) => this.http.put('/api/count', { count: newValue })
);

// In template:
<input type="number" [value]="count()" (change)="incrementCount($event.target.valueAsNumber)" />
<ng-container [cngxToastOn]="countState.state"
  toastError="Could not update count"
  [toastErrorDetail]="true" />
@if (countState.rolledBack()) {
  <span class="sr-only">Changes reverted</span>
}
```

## Styling

optimistic provides no styling — it exposes state signals for consumers:

- `rolledBack()` — Show a rollback indicator
- `error()` — Display the error message
- `state.status()` — Use the full async state for complex feedback

## Examples

### Form Field with Optimistic Update

```typescript
readonly firstName = signal('Alice');

private readonly [updateFirstName, nameState] = optimistic(
  this.firstName,
  (name) => this.http.put('/api/profile/first-name', { firstName: name })
);

<input
  type="text"
  [value]="firstName()"
  (change)="updateFirstName($event.target.value)"
  [disabled]="nameState.state.isPending()" />

@if (nameState.rolledBack()) {
  <span class="error" aria-live="polite">
    Name change failed. Your previous value was restored.
  </span>
}
```

### Checkbox with Optimistic Toggle

```typescript
readonly isSubscribed = signal(false);

private readonly [toggleSubscribed, subscribeState] = optimistic(
  this.isSubscribed,
  (value) => this.http.post('/api/subscribe', { enabled: value })
);

<label>
  <input
    type="checkbox"
    [checked]="isSubscribed()"
    (change)="toggleSubscribed($event.target.checked)" />
  Subscribe to emails
</label>

@if (subscribeState.state.isPending()) {
  <span class="loading">Updating...</span>
}

@if (subscribeState.rolledBack()) {
  <span class="error">Could not update subscription. Try again.</span>
}
```

### List Item with Optimistic Completion

```typescript
readonly todoItems = signal<Todo[]>([...]);

markAsComplete(id: string) {
  const item = this.todoItems().find(i => i.id === id);
  if (!item) return;

  const [updateItem, updateState] = optimistic(
    signal(item),
    (updated) => this.http.put(`/api/todos/${id}`, updated)
  );

  updateItem({ ...item, completed: true });

  // Show toast on rollback
  this.toaster.show({
    title: 'Could not complete task',
    message: 'It was reverted to its previous state',
    severity: 'error'
  });
}
```

### Multi-Field Form with Multiple Optimistic Updates

```typescript
readonly profile = signal<Profile>({
  name: 'Alice',
  email: 'alice@example.com',
  bio: 'Engineer'
});

private readonly [updateProfile, profileState] = optimistic(
  this.profile,
  (updated) => this.http.put('/api/profile', updated)
);

updateField(field: keyof Profile, value: any) {
  this.updateProfile({
    ...this.profile(),
    [field]: value
  });
}

<input
  type="text"
  [value]="profile().name"
  (change)="updateField('name', $event.target.value)"
  [disabled]="profileState.state.isPending()" />

<input
  type="email"
  [value]="profile().email"
  (change)="updateField('email', $event.target.value)"
  [disabled]="profileState.state.isPending()" />

<textarea
  [value]="profile().bio"
  (change)="updateField('bio', $event.target.value)"
  [disabled]="profileState.state.isPending()"></textarea>

<ng-container [cngxToastOn]="profileState.state"
  toastError="Could not save profile"
  [toastErrorDetail]="true" />

@if (profileState.rolledBack()) {
  <div class="alert alert-warning" role="alert">
    Your changes were reverted. The server rejected the update.
  </div>
}
```

### Counter with Debounced Optimistic Updates

```typescript
readonly count = signal(0);

private readonly [updateCount, countState] = optimistic(
  this.count,
  (value) => this.http.post('/api/counter', { count: value })
);

increment() {
  this.updateCount(this.count() + 1);
}

decrement() {
  this.updateCount(this.count() - 1);
}

<div>
  <button (click)="decrement()">−</button>
  <span>{{ count() }}</span>
  <button (click)="increment()">+</button>
</div>

@if (countState.state.isPending()) {
  <span class="status pending">Syncing...</span>
} @else if (countState.rolledBack()) {
  <span class="status error">Failed to sync. Reverted.</span>
}
```

### Rating with Optimistic Update

```typescript
readonly rating = signal(0);

private readonly [setRating, ratingState] = optimistic(
  this.rating,
  (value) => this.http.put(`/api/items/${itemId}/rating`, { stars: value })
);

<div class="stars" [attr.aria-label]="'Rating: ' + rating() + ' stars'">
  @for (star of [1, 2, 3, 4, 5]; track star) {
    <button
      [class.filled]="star <= rating()"
      (click)="setRating(star)"
      [disabled]="ratingState.state.isPending()"
      [attr.aria-pressed]="star <= rating()">
      ★
    </button>
  }
</div>

@if (ratingState.rolledBack()) {
  <span class="error" role="alert">Rating update failed. Please try again.</span>
}
```

## Implementation Notes

### Subscription Management

optimistic uses a managed subscription to handle the Observable:

```typescript
activeSub = action(newValue)
  .pipe(take(1))
  .subscribe({
    next: (confirmed) => {
      confirmedValue = confirmed;
      current.set(confirmed);
      statusState.set('success');
      activeSub = undefined;
    },
    error: (err) => {
      current.set(confirmedValue);  // Rollback to last confirmed
      rolledBackState.set(true);
      errorState.set(err);
      statusState.set('error');
      activeSub = undefined;
    },
  });
```

**Important:** The internal subscription is unmanaged — there is no `DestroyRef` in a plain factory function. If the component is destroyed mid-flight, the subscription completes silently. This is acceptable because:

1. The rollback always restores to the last server-confirmed value (not stale optimistic state)
2. Rapid re-invocations automatically cancel in-flight subscriptions
3. For long-running actions, ensure the component outlives the action or cancel via the Observable

### Confirmed Value Tracking

The factory tracks `confirmedValue` — the last server-confirmed state. On rollback, it restores to this value, not the stale optimistic update. Rapid concurrent calls are handled correctly:

```typescript
signal.set(valueA);  // Optimistic, in-flight
signal.set(valueB);  // Cancels valueA, new action with valueB
// On error: rolls back to previous confirmedValue, not valueA
```

## See Also

- [compodoc API documentation](../../../../../../../docs/modules/optimistic.html)
- [CngxAsyncState](../../../../../../core/utils/) — The shared state interface
- [withRetry](../retry/) — Combines well with optimistic for resilient updates
- Demo: `dev-app/src/app/demos/common/optimistic-demo/`
- Tests: `projects/common/interactive/src/optimistic/optimistic.spec.ts`
