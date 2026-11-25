import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncClick: createRetry helper',
  subtitle: 'Wrap a flaky action with <code>createRetry</code>, then bind it through <code>[cngxAsyncClick]</code>. The directive surfaces <code>pending</code> / <code>succeeded</code> / <code>failed</code>; the retry state exposes <code>attempt</code> and <code>retrying</code> so the label can count attempts mid-flight.',
  description: '<code>createRetry()</code> wraps any <code>AsyncAction</code> with bounded retries (defaults: 3 attempts, exponential backoff). The returned tuple is <code>[retryableAction, retryState]</code>; bind the action to <code>[cngxAsyncClick]</code> for the directive\'s pending / succeeded / failed signals, and the retry state for the live attempt counter and the <code>retrying</code> flag that flips true during back-off delays. <code>retryState.state</code> is a full <code>CngxAsyncState</code> view so the same setup also feeds <code>cngxToastOn</code> / <code>cngxAlertOn</code> consumers without a translator. A successful attempt clears <code>lastError</code> and <code>retrying</code> and keeps <code>attempt</code> at the attempt that succeeded; the next click resets all of it. An exhausted run leaves <code>exhausted()</code> true until the next click. The button binds <code>failedAnnouncement</code> and <code>succeededAnnouncement</code> to its visible wording, and a polite region next to it speaks each retry attempt. The chrome buttons queue failures so each path can be replayed.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['async-state', 'error-handling', 'behavior'],
  apiComponents: [
    'CngxAsyncClick',
    'createRetry',
  ],
  moduleImports: [
    'import { CngxAsyncClick, createRetry } from \'@cngx/common/interactive\';',
    "import { wrapDemoAction } from '../../../../fixtures';",
  ],
  imports: ['CngxAsyncClick'],
  setup: `
  private readonly save = (): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, 500));

  private readonly retryTuple = createRetry(() => this.save(), {
    maxAttempts: 3,
    delay: 800,
    backoff: 'exponential',
  });

  protected readonly retryAction = this.retryTuple[0];
  protected readonly retryState = this.retryTuple[1];`,
  setupChrome: `  protected readonly queuedFailures = signal(0);
  // The next queuedFailures() calls of save fail after their normal latency.
  private readonly failQueue = wrapDemoAction<() => Promise<void>>(
    this,
    'save',
    (original) => async () => {
      await original();
      if (this.queuedFailures() > 0) {
        this.queuedFailures.update((n) => n - 1);
        throw new Error('Network error');
      }
    },
  );`,
  template: `
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
  </div>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="queuedFailures.set(0)">Fail 0 times</button>
    <button type="button" class="chip" (click)="queuedFailures.set(2)">Fail 2 times</button>
    <button type="button" class="chip" (click)="queuedFailures.set(3)">Fail 3 times</button>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Queued failures</span>
      <span class="event-value">{{ queuedFailures() }}</span>
    </div>
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
