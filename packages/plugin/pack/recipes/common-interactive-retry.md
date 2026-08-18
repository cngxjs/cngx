---
title: "CngxAsyncClick: With retry helper"
whenToUse: "withRetry() wraps any AsyncAction with bounded retries (defaults: 3 attempts, exponential backoff). The returned tuple is [retryableAction, retryState]; bind the action to [cngxAsyncClick] for the directive's pending / succeeded / failed signals, and the retry state for the live attempt counter and the retrying flag that flips true during back-off delays. retryState.state is a full CngxAsyncState view so the same setup also feeds cngxToastOn / cngxAlertOn consumers without a translator. A successful attempt clears state; an exhausted run leaves exhausted() true until the next click."
symbols: [CngxAsyncClick]
---

# CngxAsyncClick: With retry helper

withRetry() wraps any AsyncAction with bounded retries (defaults: 3 attempts, exponential backoff). The returned tuple is [retryableAction, retryState]; bind the action to [cngxAsyncClick] for the directive's pending / succeeded / failed signals, and the retry state for the live attempt counter and the retrying flag that flips true during back-off delays. retryState.state is a full CngxAsyncState view so the same setup also feeds cngxToastOn / cngxAlertOn consumers without a translator. A successful attempt clears state; an exhausted run leaves exhausted() true until the next click.

## Symbols

- `CngxAsyncClick`

## Setup

```ts
private readonly flakyAction = () => new Promise<void>((resolve, reject) =>
    setTimeout(() => (Math.random() > 0.6
      ? resolve()
      : reject(new Error('Network error'))), 500),
  );

  private readonly retryTuple = withRetry(this.flakyAction, {
    maxAttempts: 3,
    delay: 800,
    backoff: 'exponential',
  });

  protected readonly retryAction = this.retryTuple[0];
  protected readonly retryState = this.retryTuple[1];
```

## Wiring

```html
<div class="button-row">
    <button
      [cngxAsyncClick]="retryAction"
      #btn="cngxAsyncClick"
      type="button"
      class="chip"
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
  </div>
```
