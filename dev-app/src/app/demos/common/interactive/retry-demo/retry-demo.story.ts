import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Retry + Optimistic',
  navLabel: 'Retry/Optimistic',
  navCategory: 'interactive',
  description:
    'withRetry() wraps AsyncAction with automatic retry. optimistic() updates signals immediately with rollback on error.',
  apiComponents: ['CngxAsyncClick'],
  overview:
    '<p><code>withRetry()</code> composes with <code>CngxAsyncClick</code> — the button gets retry for free. ' +
    '<code>optimistic()</code> is a standalone utility that updates any signal immediately and rolls back on failure.</p>',
  moduleImports: [
    "import { CngxAsyncClick, withRetry, optimistic } from '@cngx/common/interactive';",
    "import { of, switchMap, throwError, timer } from 'rxjs';",
  ],
  setup: `
  // Flaky action — fails 60% of the time
  private readonly flakyAction = () => new Promise<void>((resolve, reject) =>
    setTimeout(() => Math.random() > 0.6 ? resolve() : reject(new Error('Network error')), 500),
  );

  private readonly retryResult = withRetry(this.flakyAction, {
    maxAttempts: 3,
    delay: 800,
    backoff: 'exponential',
  });
  protected readonly retryAction = this.retryResult[0];
  protected readonly retryState = this.retryResult[1];

  // Optimistic toggle
  protected readonly liked = signal(false);
  private readonly likeResult = optimistic(this.liked, (value: boolean) =>
    timer(1000).pipe(
      switchMap(() => Math.random() > 0.3
        ? of(value)
        : throwError(() => new Error('Server rejected'))),
    ),
  );
  protected readonly toggleLike = this.likeResult[0];
  protected readonly likeState = this.likeResult[1];
  `,
  sections: [
    {
      title: 'withRetry + CngxAsyncClick',
      subtitle:
        'This button uses a flaky API (40% success rate). <code>withRetry</code> retries up to 3 times ' +
        'with exponential backoff. The retry state signals drive the UI.',
      imports: ['CngxAsyncClick'],
      template: `
  <div class="button-row">
    <button [cngxAsyncClick]="retryAction" #btn="cngxAsyncClick" class="chip"
            [style.background]="btn.succeeded() ? 'var(--success-bg, #e8f5e9)' : btn.failed() ? '#ffebee' : ''">
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
    },
    {
      title: 'optimistic() — Instant Like Toggle',
      subtitle:
        'Click to toggle. The state updates instantly (optimistic). If the server rejects (30% chance), it rolls back.',
      imports: [],
      template: `
  <div class="button-row">
    <button (click)="toggleLike(!liked())" class="chip"
            [style.background]="liked() ? '#fce4ec' : ''"
            [style.borderColor]="liked() ? '#e91e63' : ''">
      {{ liked() ? 'Liked' : 'Like' }}
    </button>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">liked</span>
      <span class="event-value">{{ liked() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Rolled back</span>
      <span class="event-value">{{ likeState.rolledBack() }}</span>
    </div>
    @if (likeState.error()) {
      <div class="event-row">
        <span class="event-label">Error</span>
        <span class="event-value" style="color:#c62828">{{ likeState.error() }}</span>
      </div>
    }
  </div>`,
    },
  ],
};
