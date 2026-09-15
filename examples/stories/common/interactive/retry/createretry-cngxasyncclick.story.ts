import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncClick: With retry helper',
  subtitle: 'Wrap a flaky action (40% success) with <code>withRetry</code>, then bind it through <code>[cngxAsyncClick]</code>. The directive surfaces <code>pending</code> / <code>succeeded</code> / <code>failed</code>; the retry state exposes <code>attempt</code> and <code>retrying</code> so the label can count attempts mid-flight.',
  description: '<code>withRetry()</code> wraps any <code>AsyncAction</code> with bounded retries (defaults: 3 attempts, exponential backoff). The returned tuple is <code>[retryableAction, retryState]</code>; bind the action to <code>[cngxAsyncClick]</code> for the directive\'s pending / succeeded / failed signals, and the retry state for the live attempt counter and the <code>retrying</code> flag that flips true during back-off delays. <code>retryState.state</code> is a full <code>CngxAsyncState</code> view so the same setup also feeds <code>cngxToastOn</code> / <code>cngxAlertOn</code> consumers without a translator. A successful attempt clears state; an exhausted run leaves <code>exhausted()</code> true until the next click.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['async-state', 'error-handling', 'behavior'],
  apiComponents: [
    'CngxAsyncClick',
    'withRetry',
  ],
  moduleImports: [
    'import { CngxAsyncClick, withRetry } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxAsyncClick'],
  setup: `
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
  protected readonly retryState = this.retryTuple[1];`,
  template: `
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
  </div>`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Attempt</span>
      <span class="event-value">{{ retryState.attempt() }} / {{ retryState.maxAttempts() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Retrying</span>
      <span class="event-value">{{ retryState.retrying() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Exhausted</span>
      <span class="event-value">{{ retryState.exhausted() }}</span>
    </div>
  </div>`,
};
