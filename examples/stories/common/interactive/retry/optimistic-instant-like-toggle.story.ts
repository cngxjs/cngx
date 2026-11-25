import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'createOptimistic(): Instant like toggle',
  subtitle: 'Click to toggle. The <code>liked</code> signal flips immediately (optimistic write); when the server rejects (tick the chrome switch), the value rolls back after the delay, <code>rolledBack()</code> turns true and a polite region says so.',
  description: 'Pair <code>createOptimistic()</code> with a plain toggle button to give a UI an immediate-response feel even on a flaky network. The signal updates synchronously on click, so the button label changes before the request settles. The returned state surface exposes <code>rolledBack()</code> and <code>error()</code> so the chrome can show the recovery path when the server rejects. <code>aria-pressed</code> mirrors the optimistic value, keeping the button semantically a toggle for assistive tech. A rollback changes the button label under the user, so an always-present polite region next to the button announces it.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['async-state', 'error-handling', 'behavior'],
  apiComponents: [
    'createOptimistic',
  ],
  moduleImports: [
    'import { createOptimistic } from \'@cngx/common/interactive\';',
    "import { map, timer, type Observable } from 'rxjs';",
    "import { failDemoActionWhen } from '../../../../fixtures';",
  ],
  imports: [],
  setup: `
  protected readonly liked = signal<boolean>(false);

  private readonly saveLike = (value: boolean): Observable<boolean> =>
    timer(1000).pipe(map(() => value));

  private readonly likeTuple = createOptimistic<boolean>(this.liked, (value) =>
    this.saveLike(value),
  );

  protected readonly toggleLike = this.likeTuple[0];
  protected readonly likeState = this.likeTuple[1];`,
  setupChrome: `  protected readonly rejectNext = signal(false);
  // Makes saveLike fail while the switch below is on.
  private readonly failSwitch = failDemoActionWhen(
    this,
    'saveLike',
    () => this.rejectNext(),
    () => new Error('Server rejected'),
  );
  protected readonly errorMessage = computed<string>(() => {
    const err = this.likeState.error();
    return err instanceof Error ? err.message : String(err);
  });`,
  template: `
  <div class="demo-inline-actions">
    <button
      type="button"
      class="chip"
      [attr.aria-pressed]="liked()"
      (click)="toggleLike(!liked())"
    >
      {{ liked() ? 'Liked' : 'Like' }}
    </button>
    <span class="demo-sr-only" aria-live="polite">{{
      likeState.state.status() === 'error' ? 'Change not saved, reverted.' : ''
    }}</span>
  </div>`,
  templateChrome: `
  <label class="event-row" style="margin-top:12px;gap:6px;align-items:center">
    <input type="checkbox" [checked]="rejectNext()" (change)="rejectNext.set($any($event.target).checked)" />
    <span>Server rejects</span>
  </label>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Status</span>
      <span class="event-value">{{ likeState.state.status() }}</span>
    </div>
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
        <span class="event-value" style="color:var(--cngx-color-danger)">{{ errorMessage() }}</span>
      </div>
    }
  </div>`,
};
