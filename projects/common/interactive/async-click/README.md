# Async Click

Directive for executing async actions on click with loading state, auto-disable, and success/error feedback.

## Import

```typescript
import { CngxAsyncClick } from '@cngx/common/interactive';
```

## Quick Start

```typescript
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
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
  private readonly http = inject(HttpClient);
  protected readonly saveAction = () => this.http.post('/api/save', {});
}
```

## Accessibility

- **ARIA roles:** Sets `aria-busy="true"` while pending and `aria-disabled="true"` on every host while pending, while the busy visual shows or while blocked. Both are immediate; only the busy visual is delayed (see Styling). The directive never sets the native `disabled` attribute
- **Keyboard interaction:**
  - `Enter`: Activates the action if focused (native button behavior)
  - `Space`: Activates the action if focused (native button behavior)
  - A click during a run is swallowed (`preventDefault`, no second run); the host keeps its pointer events and stays focusable
- **Screen reader:**
  - An auto-rendered polite region (a sibling of the host, outside its accessible name) speaks every success and error settle once
  - The region gets one write per settle: cleared at the settle, the text written after the next render, so a host can read content the settle rendered. Two runs that settle before change detection produce two writes in the same render pass; whether a screen reader voices both depends on the assistive technology. Specs that read the region need a render pass (`fixture.detectChanges()`) after the settle
  - No effect reads the copy: a language switch never re-voices the region; the next settle speaks the new language
  - `announce(message)` speaks a host message through the same region after the next render, for a settle the host reflects but the directive did not run (an external async state). It is a no-op with `[autoAnnounce]="false"`
  - `[autoAnnounce]="false"` removes the region; drive your own region from `(settled)` then (clear it, write the copy for `settle.status`). The `announcement` signal is state and coalesces settles within one flush
- **Focus management:**
  - Focus remains on the button throughout the action lifecycle
  - No focus trap or modal management (button stays focusable)

## Composition

CngxAsyncClick composes naturally with the feedback system:

- **Host directives:** None
- **Combines with:** CngxAsyncState state consumers (CngxToastOn, CngxAlertOn, CngxAsyncContainer, CngxActionButton through `[externalState]`)
- **Provides:** `state: CngxAsyncState<unknown>` for downstream feedback components
- **Emits:** `(settled)` once per success or error settle, with a monotonic `generation` (`CngxAsyncSettle`). Never on cancel, reset or after destroy. Put per-run side effects (a toast, a close, a completion output) here: a status edge read in an effect coalesces two runs that settle before change detection into one

### Example: Composition Pattern

```typescript
// Use with toast notification system. A class field cannot destructure,
// so store the tuple and read its parts into two fields.
private readonly retry = createRetry(() => this.saveAction());
protected readonly saveWithRetry = this.retry[0];
protected readonly retryState = this.retry[1];

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

Run state for hosts: the directive provides `CNGX_ASYNC_RUN_STATE` (`useExisting`) on its own element. A co-hosted component (the button family, `CngxActionButton`, the stepper controls) reads `pending`, `busyVisible`, `busy`, `enabled`, `state`, `settled` and `announce()` through that token from the same element, never through the `CngxAsyncClick` class, so another runner can drive the same host by providing the token. A host that also provides `CNGX_HOST_INTERACTION_STATE` (the button family, `CngxActionButton`) reads it lazily with `{ self: true }`: the directive in turn reads that state, so an eager inject in either direction is a cycle. A unit without that cycle injects it eagerly (the stepper next and previous controls with `{ self: true }`, the complete control with `{ host: true }`).

Status layer for action hosts: `CngxActionStatusBrain` (a selector-less host directive, `@cngx/common/interactive`) is the host-side companion of the run state. It derives the effective status from `CNGX_ASYNC_RUN_STATE` (or a bound `[externalState]`), gates the stacked label cells on `busyVisible`, and resolves the settle announcement the host passes to `CNGX_HOST_INTERACTION_STATE.announcement`: the explicit announcement, the rendered result cell, the label, the i18n copy. Hosts read it through `CNGX_ACTION_STATUS` and mark each label span with `[cngxActionStatusCell]`, or put `CngxActionStatusStack` (`span[cngxActionStatusStack]`) on their label element: it renders the idle cell with the projected content and the pending / success / error cells with their `cngxPending` / `cngxSucceeded` / `cngxFailed` template (`cngxFailed` gets the error) or label, as direct children, and `cellClass` puts the host's class on each cell. A co-hosted unit that voices an outcome itself (a toast, a close-on-success) provides `CNGX_ANNOUNCEMENT_COVER` (a multi token), so the region stays empty for an outcome any cover voices. `CngxActionButton` and `CngxPopoverAction` are built on it.

App-wide cell content comes from `CNGX_ACTION_STATUS_CONFIG`: `provideActionStatusConfig(withActionStatusLabels({ pending: 'Saving...', succeeded: 'Saved' }), withActionStatusTemplates({ ... }))` at the root, `provideActionStatusConfigAt(...)` in a component's `viewProviders` (merged over the parent scope); `provideCngxButton` / `provideCngxButtonAt` route the same features. Per cell: projected template, bound label, config template, config label, the `actionStatus` section of the language pack. The English section is empty, so a state without any of them renders no cell; a bound `''` switches a cell off, also over a config template. Labels passed as a `Signal` follow a language switch.

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

`pending()` flips on the first tick of a run. To give a hand-rolled spinner the same show delay and min-dwell as the button family, branch on `btn.busyVisible()` instead.

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
const [saveWithRetry, retryState] = createRetry(
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
      <ng-container *ngTemplateOutlet="errorTpl; context: { $implicit: btn.error() }" />
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

- [API on compodocx](../../../../README.md)
- Demo: `examples/stories/common/interactive/async-click/`
- Tests: `projects/common/interactive/async-click/async-click.directive.spec.ts`
