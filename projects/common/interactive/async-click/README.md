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

## Accessibility

- **ARIA roles:** Sets `aria-busy="true"` while pending, `aria-disabled="true"` while pending (for non-button elements). Both are immediate; only the busy visual is delayed (see Styling)
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

CngxAsyncClick sets the `cngx-async` class on its host at all times (the hook for a theme; `[cngxAsyncClick]` is a property binding and leaves no attribute) and three classes for state feedback: `.cngx-async--pending` while the busy visual shows, `.cngx-async--success` and `.cngx-async--error` for `feedbackDuration` ms after it settles.

The busy visual is gated by `busyVisible`: `.cngx-async--pending` (and the button-family spinner) appears only after `CNGX_LOADING_CONFIG.showDelay` (120 ms by default) and, once shown, stays for at least `minDwell` (400 ms), so a fast run never flashes it. `pending()`, `status()`, `aria-busy`, `aria-disabled`, the double-click guard and the announcement stay immediate. Retime app-wide with `provideLoadingConfig(withShowDelay(...), withMinDwell(...))`, per subtree with `provideLoadingConfigAt(...)`, or per instance with `[showDelay]` / `[minDwell]`. The settle classes wait until the gate releases, so `--pending` and `--success` / `--error` never coexist; `feedbackDuration` is not extended, so the tint shows for `feedbackDuration` minus the remaining dwell, and a `feedbackDuration` shorter than the remaining dwell skips the tint (`succeeded()` / `failed()` and the announcement still fire).

During the dwell tail the visual and the semantics disagree on purpose: the run has settled, so `aria-busy` and `aria-disabled` are gone and a click starts a new run, while the spinner (and `cursor: progress` on a button) stays for the rest of the min-dwell. The tail is at most `minDwell` long and only follows a run that was slow enough to show the spinner; set `[minDwell]="0"` where a control must look ready the moment it is ready.

The gate watches the directive's own run and a host-reflected run (`CNGX_HOST_INTERACTION_STATE.busy`, e.g. `CngxActionButton` with `[externalState]`); both show the busy visual. The `[busy]` input is different: it is an ARIA hint only, sets `aria-busy` and shows no spinner, because it does not describe a run the host paints.

`@cngx/common/theming/components/cngx-async.css` (part of the `cngx.css` bundle) paints them through these tokens on hosts without their own paint (a bare `<button>`, an anchor). Button-family hosts (`.cngx-button`: `cngxButton`, `cngxIconButton`, `cngxCloseButton`, `cngxActionButton`) are skipped; they keep their variant paint and show their own busy treatment.

|Token|Unset default|
|-|-|
|`--cngx-async-pending-opacity`|`0.7`|
|`--cngx-async-transition`|`var(--cngx-duration-base) ease`|
|`--cngx-async-success-bg`|12% `--cngx-color-success`|
|`--cngx-async-success-color`|`--cngx-color-success` mixed toward `--cngx-color-text`|
|`--cngx-async-success-border`|`--cngx-color-success`|
|`--cngx-async-error-bg`|12% `--cngx-color-danger`|
|`--cngx-async-error-color`|`--cngx-color-danger-text`|
|`--cngx-async-error-border`|`--cngx-color-danger`|

The colour tokens inherit, so a theme can set them once on `:root`:

```css
:root {
  --cngx-async-success-bg: color-mix(in oklab, var(--brand-ok) 15%, transparent);
  --cngx-async-error-border: var(--brand-alert);
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

- [API on compodocx](https://cngxjs.github.io/cngx/)
- Demo: `examples/stories/common/async-click-demo/`
- Tests: `projects/common/interactive/async-click/async-click.directive.spec.ts`
