# Async Click

Directive for executing async actions on click with loading state, auto-disable, and success/error feedback.

## Import

```typescript
import { CngxAsyncClick } from '@cngx/common/interactive';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxAsyncClick } from '@cngx/common/interactive';

@Component({
  selector: 'app-save-button',
  template: `
    <button [cngxAsyncClick]="saveAction" #btn="cngxAsyncClick">
      @switch (btn.status()) {
        @case ('pending')   { Saving... }
        @case ('success')   { Saved! }
        @case ('error')     { Failed }
        @default            { Save }
      }
    </button>
  `,
  imports: [CngxAsyncClick],
})
export class SaveButtonComponent {
  saveAction = () => this.http.post('/api/save', {});

  constructor(private http: HttpClient) {}
}
```

## API

### Inputs

|-|-|-|-|
| cngxAsyncClick | AsyncAction | required | The async action function to execute on click (returns Promise or Observable) |
| feedbackDuration | number | 2000 | Duration in ms to display success/error state before resetting |
| enabled | boolean | true | When false, clicks are ignored (does not set disabled attribute) |
| succeededAnnouncement | string | 'Action succeeded' | Label announced to screen readers on success |
| failedAnnouncement | string | 'Action failed' | Label announced to screen readers on failure |

### Outputs

|-|-|-|
| — | — | — |

### Signals

#### Public Signals (read-only)
- `pending: Signal<boolean>` — True while the action is executing
- `succeeded: Signal<boolean>` — True for feedbackDuration ms after success
- `failed: Signal<boolean>` — True for feedbackDuration ms after failure
- `error: Signal<unknown>` — The error value from a failed action (undefined if not failed)
- `status: Signal<AsyncStatus>` — Current lifecycle status: 'idle' | 'pending' | 'success' | 'error'
- `announcement: Signal<string>` — Screen reader announcement for the current state (bind to aria-live region)
- `state: CngxAsyncState<unknown>` — Full async state view; bind to feedback system consumers ([state]="btn.state")

#### CSS Custom Properties
- No CSS custom properties — styling is the consumer's responsibility

## Accessibility

CngxAsyncClick is fully accessible out of the box:

- **ARIA roles:** Sets `aria-busy="true"` while pending, `aria-disabled="true"` while pending (for non-button elements)
- **Keyboard interaction:**
  - `Enter`: Activates the action if focused (native button behavior)
  - `Space`: Activates the action if focused (native button behavior)
  - Disabled during action execution (pointer-events: none)
- **Screen reader:**
  - `announcement` signal updates an always-present aria-live region
  - Status changes (pending, success, error) are announced via the live region
  - For buttons, success/error states are announced immediately (no delay)
- **Focus management:**
  - Focus remains on the button throughout the action lifecycle
  - No focus trap or modal management (button stays focusable)

## Composition

CngxAsyncClick composes naturally with the feedback system:

- **Host directives:** None
- **Combines with:** CngxAsyncState state consumers (CngxToastOn, CngxAlertOn, CngxAsyncContainer, CngxActionButton)
- **Provides:** `state: CngxAsyncState<unknown>` for downstream feedback components

### Example: Composition Pattern

```typescript
// Use with toast notification system
readonly [saveWithRetry, retryState] = withRetry(() => this.saveAction());

// In template:
<button [cngxAsyncClick]="saveWithRetry" #btn="cngxAsyncClick">
  @switch (btn.status()) {
    @case ('pending')   { Saving... }
    @case ('success')   { Done }
    @case ('error')     { Failed: {{ btn.error() }} }
    @default            { Save }
  }
</button>
<ng-container [cngxToastOn]="btn.state"
  toastSuccess="Saved successfully"
  toastError="Failed to save"
  [toastErrorDetail]="true" />
```

## Styling

CngxAsyncClick applies three CSS classes for state feedback. All visual styling is your responsibility:

```scss
.cngx-async--pending {
  // Applied while action is executing
}
.cngx-async--success {
  // Applied after successful action (for feedbackDuration ms)
}
.cngx-async--error {
  // Applied after failed action (for feedbackDuration ms)
}
```

Override in your component CSS:

```scss
button {
  transition: background-color 0.3s;
}
button.cngx-async--pending {
  background-color: var(--color-pending);
  opacity: 0.7;
}
button.cngx-async--success {
  background-color: var(--color-success);
}
button.cngx-async--error {
  background-color: var(--color-error);
}
```

## Examples

### Basic Usage

```typescript
// Simple click action
<button [cngxAsyncClick]="() => deleteItem(id)">Delete</button>
```

### With Material

```typescript
<button mat-raised-button [cngxAsyncClick]="submitForm" #btn="cngxAsyncClick">
  @if (btn.pending()) {
    <mat-spinner diameter="20" /> Submitting...
  } @else if (btn.succeeded()) {
    <mat-icon>check</mat-icon> Submitted
  } @else if (btn.failed()) {
    <mat-icon>error</mat-icon> Failed
  } @else {
    Submit
  }
</button>
```

### With Retry

```typescript
const [saveWithRetry, retryState] = withRetry(
  () => this.http.post('/api/save', data),
  { maxAttempts: 3, delay: 1000, backoff: 'exponential' }
);

<button [cngxAsyncClick]="saveWithRetry" #btn="cngxAsyncClick">
  @if (btn.pending()) { Saving (attempt {{ retryState.attempt() }}/{{ retryState.maxAttempts() }}) }
  @else { Save }
</button>
```

### With Template Slots

```typescript
// Override status displays with custom templates
<button [cngxAsyncClick]="saveAction" #btn="cngxAsyncClick">
  @switch (btn.status()) {
    @case ('pending') {
      <ng-container *ngTemplateOutlet="pendingTpl" />
    }
    @case ('success') {
      <ng-container *ngTemplateOutlet="successTpl" />
    }
    @case ('error') {
      <ng-container *ngTemplateOutlet="errorTpl; context: { err: btn.error() }" />
    }
    @default {
      Save
    }
  }
</button>

<ng-template #pendingTpl>
  <svg class="spinner" /> Saving...
</ng-template>

<ng-template #successTpl>
  <svg class="check-icon" /> Saved!
</ng-template>

<ng-template #errorTpl let-err>
  <svg class="error-icon" /> Error: {{ err | json }}
</ng-template>
```

### Accessibility-First: ARIA Announcements

```typescript
<button
  [cngxAsyncClick]="action"
  #btn="cngxAsyncClick"
  [attr.aria-label]="buttonLabel()"
  aria-describedby="status-region">
  {{ buttonLabel() }}
</button>

// Screen reader will announce status changes
<span id="status-region" aria-live="polite" class="sr-only">
  {{ btn.announcement() }}
</span>
```

## Template Marker Directives

CngxAsyncClick pairs with three template marker directives for component libraries like CngxActionButton:

### CngxPending

Template shown while an async action is executing.

```typescript
import { CngxPending } from '@cngx/common/interactive';

@Component({
  template: `
    <ng-template cngxPending>Saving...</ng-template>
  `,
  imports: [CngxPending],
})
```

### CngxSucceeded

Template shown after an async action succeeds (for feedbackDuration ms).

```typescript
<ng-template cngxSucceeded>Saved!</ng-template>
```

### CngxFailed

Template shown after an async action fails (for feedbackDuration ms). The implicit template context provides the error value.

```typescript
<ng-template cngxFailed let-err>Failed: {{ err }}</ng-template>
```

## See Also

- [compodoc API documentation](../../../../../../../docs/modules/CngxAsyncClick.html)
- Demo: `dev-app/src/app/demos/common/async-click-demo/`
- Tests: `projects/common/interactive/src/async-click/async-click.directive.spec.ts`
