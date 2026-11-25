---
title: "CngxAsyncClick: createRetry helper"
whenToUse: "createRetry() wraps any AsyncAction with bounded retries (defaults: 3 attempts, exponential backoff). The returned tuple is [retryableAction, retryState]; bind the action to [cngxAsyncClick] for the directive's pending / succeeded / failed signals, and the retry state for the live attempt counter and the retrying flag that flips true during back-off delays. retryState.state is a full CngxAsyncState view so the same setup also feeds cngxToastOn / cngxAlertOn consumers without a translator. A successful attempt clears lastError and retrying and keeps attempt at the attempt that succeeded; the next click resets all of it. An exhausted run leaves exhausted() true until the next click. The button binds failedAnnouncement and succeededAnnouncement to its visible wording, and a polite region next to it speaks each retry attempt. The chrome buttons queue failures so each path can be replayed."
symbols: [CngxAsyncClick]
---

# CngxAsyncClick: createRetry helper

createRetry() wraps any AsyncAction with bounded retries (defaults: 3 attempts, exponential backoff). The returned tuple is [retryableAction, retryState]; bind the action to [cngxAsyncClick] for the directive's pending / succeeded / failed signals, and the retry state for the live attempt counter and the retrying flag that flips true during back-off delays. retryState.state is a full CngxAsyncState view so the same setup also feeds cngxToastOn / cngxAlertOn consumers without a translator. A successful attempt clears lastError and retrying and keeps attempt at the attempt that succeeded; the next click resets all of it. An exhausted run leaves exhausted() true until the next click. The button binds failedAnnouncement and succeededAnnouncement to its visible wording, and a polite region next to it speaks each retry attempt. The chrome buttons queue failures so each path can be replayed.

## Symbols

- `CngxAsyncClick`

## Setup

```ts
private readonly save = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 500));

private readonly retryTuple = createRetry(() => this.save(), {
  maxAttempts: 3,
  delay: 800,
  backoff: 'exponential',
});

protected readonly retryAction = this.retryTuple[0];
protected readonly retryState = this.retryTuple[1];
```

## Wiring

```html
<div class="demo-inline-actions">
  <button
    [cngxAsyncClick]="retryAction"
    #btn="cngxAsyncClick"
    [failedAnnouncement]="'All retries failed'"
    [succeededAnnouncement]="'Success!'"
    type="button"
    class="chip demo-retry-chip"
    [style.background]="btn.succeeded() ? 'var(--cngx-color-success)' : btn.failed() ? 'var(--cngx-color-danger)' : ''"
  >
    @if (btn.pending()) {
      Attempt {{ retryState.attempt() }}/{{ retryState.maxAttempts() }}...
    } @else if (btn.succeeded()) {
      Success!
    } @else if (btn.failed()) {
      All retries failed
    } @else {
      Flaky Save
    }
  </button>
  <span class="demo-sr-only" aria-live="polite">{{
    btn.pending() && retryState.attempt() > 1
      ? 'Retrying, attempt ' + retryState.attempt() + ' of ' + retryState.maxAttempts()
      : ''
  }}</span>
</div>
```
