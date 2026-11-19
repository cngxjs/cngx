import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncClick: Settle events',
  subtitle: '<code>(settled)</code> once per run with a <code>generation</code>, and an action that ends early on the <code>AbortSignal</code> the directive hands it.',
  description: '<code>cngxAsyncClick</code> emits <code>(settled)</code> once per success or error with a <code>CngxAsyncSettle</code> payload: a monotonic <code>generation</code>, the <code>status</code> and the <code>error</code>. Per-run side effects (a toast, a close, a log entry) belong there, because <code>status()</code> is state and coalesces two runs that settle before change detection. The action receives an <code>AbortSignal</code> that aborts when the directive is destroyed. The library never cancels the run itself: this upload listens for the abort and stops its timer. <code>createRetry</code> forwards the signal to every attempt, clears its backoff on abort, settles its state idle and resolves <code>CNGX_ASYNC_CANCELLED</code>. A cancelled run emits no <code>(settled)</code>. Each settle is also spoken through the polite live region <code>cngxAsyncClick</code> renders next to the button.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['async-state', 'behavior'],
  apiComponents: [
    'CngxAsyncClick',
    'createRetry',
  ],
  moduleImports: [
    'import { CNGX_ASYNC_CANCELLED, CngxAsyncClick, createRetry, type CngxAsyncSettle } from \'@cngx/common/interactive\';',
    'import { failDemoActionWhen, wrapDemoAction, mirrorScreenReader } from \'../../../../fixtures\';',
  ],
  imports: ['CngxAsyncClick'],
  setup: `
  protected readonly settles = signal<readonly CngxAsyncSettle[]>([]);
  protected readonly mounted = signal(true);

  // Stops its own timer when the runner aborts the signal.
  private readonly upload = (signal?: AbortSignal): Promise<void> =>
    new Promise((resolve, reject) => {
      const handleAbort = (): void => {
        clearTimeout(timer);
        reject(signal?.reason);
      };
      const timer = setTimeout(() => {
        signal?.removeEventListener('abort', handleAbort);
        resolve();
      }, 600);
      signal?.addEventListener('abort', handleAbort, { once: true });
    });

  private readonly retry = createRetry((signal?: AbortSignal) => this.upload(signal), {
    maxAttempts: 3,
    delay: 1500,
  });
  protected readonly retryState = this.retry[1];

  protected readonly uploadWithRetry = (signal?: AbortSignal) => this.retry[0](signal);

  protected handleSettled(settle: CngxAsyncSettle): void {
    this.settles.update((list) => [...list, settle]);
  }`,
  setupChrome: `
  protected readonly failAttempts = signal(false);
  protected readonly abortsSeen = signal(0);
  protected readonly lastRun = signal<'running' | 'settled' | 'cancelled' | '-'>('-');

  // Makes every upload attempt fail while the switch below is on.
  private readonly failSwitch = failDemoActionWhen(
    this,
    'upload',
    () => this.failAttempts(),
    () => new Error('Upload failed'),
  );

  // Counts the aborts an upload attempt receives while it is in flight.
  private readonly abortCounter = wrapDemoAction(this, 'upload', (original) => (signal) => {
    const count = (): void => this.abortsSeen.update((n) => n + 1);
    signal?.addEventListener('abort', count, { once: true });
    return Promise.resolve(original(signal)).finally(() =>
      signal?.removeEventListener('abort', count),
    );
  });

  // Tracks whether the last run settled or ended in CNGX_ASYNC_CANCELLED.
  private readonly runTracker = wrapDemoAction(this, 'uploadWithRetry', (original) => async (signal) => {
    this.lastRun.set('running');
    let result: unknown;
    try {
      result = await original(signal);
      return result;
    } finally {
      this.lastRun.set(result === CNGX_ASYNC_CANCELLED ? 'cancelled' : 'settled');
    }
  });

  // Mirrors the busy state and the live region writes into the box below.
  protected readonly sr = mirrorScreenReader([
    { label: 'button', selector: 'button:has(+ [aria-live])' },
  ]);`,
  template: `
  <div class="demo-inline-actions">
    @if (mounted()) {
      <button type="button"
        [cngxAsyncClick]="uploadWithRetry"
        (settled)="handleSettled($event)"
        #btn="cngxAsyncClick"
      >
        @switch (btn.status()) {
          @case ('pending') { Uploading, attempt {{ retryState.attempt() }} of {{ retryState.maxAttempts() }} }
          @case ('success') { Uploaded }
          @case ('error') { Upload failed }
          @default { Upload report }
        }
      </button>
    }
  </div>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <label>
      <input type="checkbox" [checked]="failAttempts()" (change)="failAttempts.set($any($event.target).checked)" />
      Fail every attempt
    </label>
    <button type="button" (click)="mounted.set(!mounted())">
      {{ mounted() ? 'Remove the button' : 'Mount the button again' }}
    </button>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">(settled)</span>
      <span class="event-value">
        @for (s of settles(); track s) {
          #{{ s.generation }} {{ s.status }}{{ $last ? '' : ', ' }}
        } @empty {
          -
        }
      </span>
    </div>
    <div class="event-row">
      <span class="event-label">last run</span>
      <span class="event-value">{{ lastRun() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">retryState</span>
      <span class="event-value">
        {{ retryState.state.status() }}, attempt {{ retryState.attempt() }}, retrying {{ retryState.retrying() }}
      </span>
    </div>
    <div class="event-row">
      <span class="event-label">aborts seen by the action</span>
      <span class="event-value">{{ abortsSeen() }}</span>
    </div>
  </div>
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">Screen reader hears</p>
    <dl class="cngx-ex-sr-output__list">
      @for (row of sr.rows(); track row.label) {
        <dt>{{ row.label }} aria-busy</dt>
        <dd>{{ row.busy }}</dd>
      }
      @for (entry of sr.heard(); track entry.n) {
        <dt>#{{ entry.n }}</dt>
        <dd>{{ entry.text }}</dd>
      } @empty {
        <dt>announced</dt>
        <dd>-</dd>
      }
    </dl>
    <p class="cngx-ex-sr-output__note">
      The last five texts written to the polite live region next to the button, newest last. They are spoken as well as painted on the button; two writes in one frame may be voiced once, depending on the screen reader.
    </p>
  </div>`,
};
