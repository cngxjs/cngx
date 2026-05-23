import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'optimistic(): Instant like toggle',
  subtitle: 'Click to toggle. The <code>liked</code> signal flips immediately (optimistic write); when the server rejects (30% chance), the value rolls back after the delay and <code>rolledBack()</code> turns true.',
  description: 'Pair <code>optimistic()</code> with a plain toggle button to give a UI an immediate-response feel even on a flaky network. The signal updates synchronously on click, so the button label changes before the request settles. The returned state surface exposes <code>rolledBack()</code> and <code>error()</code> so the chrome can show the recovery path when the server rejects. <code>aria-pressed</code> mirrors the optimistic value, keeping the button semantically a toggle for assistive tech.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['async-state', 'error-handling', 'behavior'],
  apiComponents: [
    'optimistic',
  ],
  moduleImports: [
    'import { optimistic } from \'@cngx/common/interactive\';',
    'import { of, switchMap, throwError, timer } from \'rxjs\';',
  ],
  imports: [],
  setup: `
  protected readonly liked = signal<boolean>(false);

  private readonly likeTuple = optimistic<boolean>(this.liked, (value) =>
    timer(1000).pipe(
      switchMap(() => (Math.random() > 0.3
        ? of(value)
        : throwError(() => new Error('Server rejected')))),
    ),
  );

  protected readonly toggleLike = this.likeTuple[0];
  protected readonly likeState = this.likeTuple[1];`,
  template: `
  <div class="button-row">
    <button
      type="button"
      class="chip"
      [attr.aria-pressed]="liked()"
      (click)="toggleLike(!liked())"
    >
      {{ liked() ? 'Liked' : 'Like' }}
    </button>
  </div>`,
  templateChrome: `
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
