import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'withRetry + CngxAsyncClick',
  subtitle: 'This button uses a flaky API (40% success rate). <code>withRetry</code> retries up to 3 times with exponential backoff. The retry state signals drive the UI.',
  description: 'withRetry() wraps AsyncAction with automatic retry. optimistic() updates signals immediately with rollback on error.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['async-state', 'error-handling', 'behavior'],
  apiComponents: [
    'CngxAsyncClick',
  ],
  moduleImports: [
    'import { CngxAsyncClick, withRetry } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxAsyncClick'],
  setupChrome: `private readonly flakyAction = () => new Promise<void>((resolve, reject) =>
    setTimeout(() => Math.random() > 0.6 ? resolve() : reject(new Error('Network error')), 500),
  );
  private readonly retryResult = withRetry(this.flakyAction, {
    maxAttempts: 3,
    delay: 800,
    backoff: 'exponential',
  });
  protected readonly retryAction = this.retryResult[0];
  protected readonly retryState = this.retryResult[1];`,
  template: ``,
  templateChrome: `<div class="button-row">
    <button [cngxAsyncClick]="retryAction" #btn="cngxAsyncClick" class="chip"
            [style.background]="btn.succeeded() ? 'var(--cngx-color-success)' : btn.failed() ? '#ffebee' : ''">
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
