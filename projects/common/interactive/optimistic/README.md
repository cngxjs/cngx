# Optimistic Updates

`createOptimistic(current, action, destroyRef?)` writes a new value into a signal at once and confirms it through an async action. The action returns `Observable<T>`; the function returns the tuple `[apply, state]`.

## Import

```typescript
import { createOptimistic, type OptimisticState } from '@cngx/common/interactive';
```

## Quick Start

A class field cannot destructure, so store the tuple and name its parts:

```typescript
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { createOptimistic } from '@cngx/common/interactive';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.html',
})
export class ProfileComponent {
  private readonly http = inject(HttpClient);

  readonly name = signal('Alice');
  private readonly nameUpdate = createOptimistic(
    this.name,
    (name) => this.http.put<string>('/api/name', { name }),
    inject(DestroyRef),
  );
  protected readonly updateName = this.nameUpdate[0];
  protected readonly nameState = this.nameUpdate[1];
}
```

```html
<input [value]="name()" (change)="updateName($any($event.target).value)" />
@if (nameState.rolledBack()) {
  <span class="error">Reverted - server rejected the change</span>
}
```

## Behaviour

- **Apply:** `apply(value)` writes `value` into the signal and sets `state.state.status()` to `pending`. `apply` never throws.
- **Success:** the value the action emits is written into the signal, status `success`. An Observable that completes without a value confirms the applied value.
- **Failure:** an error, or an action that throws synchronously, writes the rollback target back, sets `rolledBack()` true, `error()` to the error and the status to `error`.
- **Rollback target:** the value the signal held before the apply. While an earlier apply is still in flight, the target stays the value held before that earlier apply, never an unconfirmed optimistic value.
- **Overlapping applies:** a new apply cancels the run in flight, so the superseded run's late outcome is dropped.
- **Lifetime:** pass the owner's `DestroyRef` as the third argument. On destroy the in-flight run is cancelled and later applies do nothing; the unconfirmed value stays in the signal and the status stays `pending`. Without it the caller owns the lifetime: a run still in flight after the owner is gone keeps its subscription, and a late emission writes the signal.
- **`state.state.data()`** is always `undefined`; the value lives in the signal you passed.

## Accessibility

createOptimistic provides state signals but has no built-in ARIA:

- **ARIA roles:** None (state is application-specific)
- **Keyboard interaction:** None (the input or control handles interaction)
- **Screen reader:**
  - Bind `state` to feedback consumers for error announcements
  - Announce rollback via aria-live region: "Changes were reverted"
- **Focus management:** None

## Composition

createOptimistic composes with any signal and can integrate with the feedback system:

- **Host directives:** None (utility function, not a directive)
- **Combines with:** Form controls, feedback system (toasts, alerts)
- **Provides:** Optimistic update function + OptimisticState

### Example: Composition Pattern

```typescript
readonly count = signal(0);
private readonly countUpdate = createOptimistic(
  this.count,
  (count) => this.http.put<number>('/api/count', { count }),
);
protected readonly setCount = this.countUpdate[0];
protected readonly countState = this.countUpdate[1];
```

```html
<input type="number" [value]="count()" (change)="setCount($any($event.target).valueAsNumber)" />
<ng-container [cngxToastOn]="countState.state"
  toastError="Could not update count"
  [toastErrorDetail]="true" />
@if (countState.rolledBack()) {
  <span class="sr-only">Changes reverted</span>
}
```

## Styling

createOptimistic provides no styling - it exposes state signals for consumers:

- `rolledBack()` - Show a rollback indicator
- `error()` - Display the error message
- `state.status()` - Use the full async state for complex feedback

## Examples

### Form Field with Optimistic Update

```typescript
readonly firstName = signal('Alice');
private readonly firstNameUpdate = createOptimistic(
  this.firstName,
  (firstName) => this.http.put<string>('/api/profile/first-name', { firstName }),
);
protected readonly updateFirstName = this.firstNameUpdate[0];
protected readonly nameState = this.firstNameUpdate[1];
```

```html
<input
  type="text"
  [value]="firstName()"
  (change)="updateFirstName($any($event.target).value)"
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
private readonly subscribedUpdate = createOptimistic(
  this.isSubscribed,
  (enabled) => this.http.post<boolean>('/api/subscribe', { enabled }),
);
protected readonly toggleSubscribed = this.subscribedUpdate[0];
protected readonly subscribeState = this.subscribedUpdate[1];
```

```html
<label>
  <input
    type="checkbox"
    [checked]="isSubscribed()"
    (change)="toggleSubscribed($any($event.target).checked)" />
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

One controller on the list signal. The action confirms the whole list, so a failure restores the list as it was before the apply:

```typescript
readonly todoItems = signal<Todo[]>([]);
private readonly todosUpdate = createOptimistic(
  this.todoItems,
  (todos) => this.http.put<Todo[]>('/api/todos', todos),
);
protected readonly todosState = this.todosUpdate[1];

markAsComplete(id: string) {
  const [applyTodos] = this.todosUpdate;
  applyTodos(this.todoItems().map((t) => (t.id === id ? { ...t, completed: true } : t)));
}
```

```html
<ng-container [cngxToastOn]="todosState.state" toastError="Could not complete task" />
```

### Multi-Field Form with Multiple Optimistic Updates

```typescript
readonly profile = signal<Profile>({
  name: 'Alice',
  email: 'alice@example.com',
  bio: 'Engineer',
});
private readonly profileUpdate = createOptimistic(
  this.profile,
  (updated) => this.http.put<Profile>('/api/profile', updated),
);
protected readonly profileState = this.profileUpdate[1];

updateField(field: keyof Profile, value: string) {
  const [applyProfile] = this.profileUpdate;
  applyProfile({ ...this.profile(), [field]: value });
}
```

```html
<input
  type="text"
  [value]="profile().name"
  (change)="updateField('name', $any($event.target).value)"
  [disabled]="profileState.state.isPending()" />

<input
  type="email"
  [value]="profile().email"
  (change)="updateField('email', $any($event.target).value)"
  [disabled]="profileState.state.isPending()" />

<textarea
  [value]="profile().bio"
  (change)="updateField('bio', $any($event.target).value)"
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

### Counter with Rapid Updates

Nothing is debounced: every click applies at once and starts a new action. The run still in flight is cancelled, so only the latest click is confirmed, and a failure goes back to the value held before the first unconfirmed click.

```typescript
readonly count = signal(0);
private readonly countUpdate = createOptimistic(
  this.count,
  (count) => this.http.post<number>('/api/counter', { count }),
);
protected readonly countState = this.countUpdate[1];

increment() {
  const [applyCount] = this.countUpdate;
  applyCount(this.count() + 1);
}

decrement() {
  const [applyCount] = this.countUpdate;
  applyCount(this.count() - 1);
}
```

```html
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
private readonly ratingUpdate = createOptimistic(
  this.rating,
  (stars) => this.http.put<number>(`/api/items/${this.itemId}/rating`, { stars }),
);
protected readonly setRating = this.ratingUpdate[0];
protected readonly ratingState = this.ratingUpdate[1];
```

```html
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

## See Also

- [API on compodocx](https://cngxjs.github.io/cngx/main/common/interactive/optimistic/)
- [CngxAsyncState](../../../core/utils/) - The shared state interface
- [createRetry](../retry/) - Combines well with createOptimistic for resilient updates
- Demo: `examples/stories/common/optimistic-demo/`
- Tests: `projects/common/interactive/optimistic/optimistic.spec.ts`
