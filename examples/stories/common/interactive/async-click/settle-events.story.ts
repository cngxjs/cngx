import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncClick: Settle events',
  subtitle: '<code>(settled)</code> once per run with a <code>generation</code>, and an action that ends early on the <code>AbortSignal</code> the directive hands it.',
  description: '<code>cngxAsyncClick</code> emits <code>(settled)</code> once per success or error with a <code>CngxAsyncSettle</code> payload: a monotonic <code>generation</code>, the <code>status</code> and the <code>error</code>. Per-run side effects (a toast, a close, a log entry) belong there, because <code>status()</code> is state and coalesces two runs that settle before change detection. The action receives an <code>AbortSignal</code> that aborts when the directive is destroyed. The library never cancels the run itself: this upload listens for the abort and stops its timer. <code>createRetry</code> forwards the signal to every attempt, clears its backoff on abort, settles its state idle and resolves <code>CNGX_ASYNC_CANCELLED</code>. A cancelled run emits no <code>(settled)</code>. Start an upload with failing attempts, then remove the button while it retries.',
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
  ],
  imports: ['CngxAsyncClick'],
  setup: `
  protected readonly settles = signal<readonly CngxAsyncSettle[]>([]);
  protected readonly lastRun = signal<'running' | 'settled' | 'cancelled' | '-'>('-');

  // Stops its own timer when the runner aborts the signal.
  private readonly upload = (signal?: AbortSignal): Promise<void> =>
    new Promise((resolve, reject) => {
      const handleAbort = (): void => {
        clearTimeout(timer);
        this.abortsSeen.update((n) => n + 1);
        reject(signal?.reason);
      };
      const timer = setTimeout(() => {
        signal?.removeEventListener('abort', handleAbort);
        if (this.failAttempts()) {
          reject(new Error('Upload failed'));
        } else {
          resolve();
        }
      }, 600);
      signal?.addEventListener('abort', handleAbort, { once: true });
    });

  private readonly retry = createRetry(this.upload, { maxAttempts: 3, delay: 1500 });
  protected readonly retryState = this.retry[1];

  protected readonly uploadWithRetry = async (signal?: AbortSignal): Promise<unknown> => {
    this.lastRun.set('running');
    let result: unknown;
    try {
      result = await this.retry[0](signal);
      return result;
    } finally {
      this.lastRun.set(result === CNGX_ASYNC_CANCELLED ? 'cancelled' : 'settled');
    }
  };

  protected handleSettled(settle: CngxAsyncSettle): void {
    this.settles.update((list) => [...list, settle]);
  }`,
  setupChrome: `
  protected readonly failAttempts = signal(false);
  protected readonly mounted = signal(true);
  protected readonly abortsSeen = signal(0);`,
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
  </div>`,
};
