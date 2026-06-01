import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncClick: Success and error feedback',
  subtitle: 'Toggle the fail flag to flip the action between success and error settle paths. Watch the host class swap from <code>.cngx-async--success</code> to <code>--error</code> for <code>feedbackDuration</code> ms.',
  description: 'Both settle paths share the same auto-reset timer. On success the directive sets <code>succeeded()</code> true and schedules a <code>feedbackDuration</code>-ms timeout that clears it back to idle. On failure it sets <code>failed()</code> true and stashes the rejection reason on <code>error()</code>, then runs the same timer. A click while the directive is still in either settle state cancels the pending reset and immediately starts a new pending cycle. <code>feedbackDuration</code> binds the visible state-feedback window; consumers needing persistent error display read <code>btn.error()</code> separately.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'async-state', 'error-handling'],
  apiComponents: [
    'CngxAsyncClick',
  ],
  moduleImports: [
    'import { CngxAsyncClick } from \'@cngx/common/interactive\';',
    'import { of, throwError } from \'rxjs\';',
    'import { delay } from \'rxjs/operators\';',
  ],
  imports: ['CngxAsyncClick'],
  setup: `
  protected readonly submitAction = () => this.shouldFail()
    ? throwError(() => new Error('Server rejected the request')).pipe(delay(700))
    : of(undefined).pipe(delay(700));`,
  setupChrome: `
  protected readonly shouldFail = signal<boolean>(false);

  protected formatError(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (err === undefined || err === null) return '—';
    return String(err);
  }`,
  template: `
  <button type="button" [cngxAsyncClick]="submitAction" #btn="cngxAsyncClick">
    @switch (btn.status()) {
      @case ('pending') { Submitting... }
      @case ('success') { Submitted! }
      @case ('error') { Failed }
      @default { Submit }
    }
  </button>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <label>
      <input type="checkbox" [checked]="shouldFail()" (change)="shouldFail.set($any($event.target).checked)" />
      Server fails
    </label>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">status()</span>
      <span class="event-value">{{ btn.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">error()</span>
      <span class="event-value">{{ formatError(btn.error()) }}</span>
    </div>
  </div>`,
};
