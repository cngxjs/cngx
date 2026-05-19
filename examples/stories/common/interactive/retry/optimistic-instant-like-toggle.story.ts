import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'optimistic() — Instant Like Toggle',
  subtitle: 'Click to toggle. The state updates instantly (optimistic). If the server rejects (30% chance), it rolls back.',
  description: 'withRetry() wraps AsyncAction with automatic retry. optimistic() updates signals immediately with rollback on error.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['async-state', 'error-handling', 'behavior'],
  apiComponents: [
    'CngxAsyncClick',
  ],
  moduleImports: [
    'import { optimistic } from \'@cngx/common/interactive\';',
    'import { of, switchMap, throwError, timer } from \'rxjs\';',
  ],
  setup: `protected readonly liked = signal(false);
  private readonly likeResult = optimistic(this.liked, (value: boolean) =>
    timer(1000).pipe(
      switchMap(() => Math.random() > 0.3
        ? of(value)
        : throwError(() => new Error('Server rejected'))),
    ),
  );
  protected readonly toggleLike = this.likeResult[0];
  protected readonly likeState = this.likeResult[1];`,
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
        <span class="event-value" style="color:var(--cngx-color-danger)">{{ likeState.error() }}</span>
      </div>
    }
  </div>`,
};
