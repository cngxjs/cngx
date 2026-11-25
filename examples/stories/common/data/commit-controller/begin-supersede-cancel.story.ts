import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'createCommitController: begin, supersede, cancel',
  subtitle:
    'A plain state machine for "write to the server, then update the value": <code>begin()</code> runs a commit, a second <code>begin()</code> supersedes the first, <code>cancel({ settle: true })</code> returns to <code>idle</code>.',
  description:
    '<code>createCommitController&lt;T&gt;()</code> is the commit lifecycle the select family and the stepper share, as a plain factory for your own controls. <code>begin(runner, intended, previous, handlers)</code> sets <code>pending</code>, remembers <code>intendedValue()</code> and runs the runner, which gets <code>onSuccess</code> / <code>onError</code> routes and returns a cancel handle. Exactly one handler fires per commit; a newer <code>begin()</code> cancels the older runner and drops its late outcome. The controller writes only its own <code>state</code>: the handlers decide what the value becomes, here pessimistically (the theme changes on success only). <code>cancel({ settle: true })</code> aborts without a handler and returns <code>state</code> to <code>idle</code>. Inside a select, reach for <code>createSelectCommitController</code> from <code>@cngx/forms/select</code> instead. The chrome switch makes the save fail.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['async-state', 'behavior'],
  apiComponents: ['createCommitController', 'CngxAsyncStatus'],
  moduleImports: [
    "import { createCommitController, type CngxCommitRunner } from '@cngx/common/data';",
    "import { CngxAsyncStatus } from '@cngx/common/interactive';",
    "import { failDemoActionWhen } from '../../../../fixtures';",
  ],
  imports: ['CngxAsyncStatus'],
  setup: `protected readonly theme = signal<string>('light');
  protected readonly commit = createCommitController<string>();

  // The server call. Resolves with the value it stored.
  private readonly save = (value: string): Promise<string> =>
    new Promise((resolve) => setTimeout(() => resolve(value), 1000));

  protected readonly outcome = computed(() => {
    switch (this.commit.state.status()) {
      case 'success':
        return \`Theme saved: \${this.theme()}\`;
      case 'error':
        return \`Could not save \${this.commit.intendedValue()}, kept \${this.theme()}\`;
      default:
        return '';
    }
  });

  protected handlePick(next: string): void {
    this.commit.begin(this.runnerFor(next), next, this.theme(), {
      onSuccess: (committed) => this.theme.set(committed ?? next),
      onError: (_err, previous) => this.theme.set(previous ?? 'light'),
    });
  }

  protected handleCancel(): void {
    this.commit.cancel({ settle: true });
  }

  private runnerFor(value: string): CngxCommitRunner<string> {
    return ({ onSuccess, onError }) => {
      let live = true;
      this.save(value).then(
        (stored) => live && onSuccess(stored),
        (err: unknown) => live && onError(err),
      );
      return { cancel: () => (live = false) };
    };
  }`,
  setupChrome: `  protected readonly failNext = signal(false);
  // Makes save fail while the switch below is on.
  private readonly failSwitch = failDemoActionWhen(
    this,
    'save',
    () => this.failNext(),
    () => new Error('Server error'),
  );`,
  template: `
  <div role="group" aria-label="Theme" class="demo-inline-actions" [cngxAsyncStatus]="commit.state">
    <button type="button" class="chip" [attr.aria-pressed]="theme() === 'light'" (click)="handlePick('light')">Light</button>
    <button type="button" class="chip" [attr.aria-pressed]="theme() === 'dark'" (click)="handlePick('dark')">Dark</button>
    <button type="button" class="chip" [attr.aria-pressed]="theme() === 'high-contrast'" (click)="handlePick('high-contrast')">High contrast</button>
    <button type="button" class="chip" (click)="handleCancel()">Cancel</button>
  </div>
  <p role="status">{{ outcome() }}</p>`,
  templateChrome: `<label class="event-row" style="margin-top:12px;gap:6px;align-items:center">
    <input type="checkbox" [checked]="failNext()" (change)="failNext.set($any($event.target).checked)" />
    <span>Server fails</span>
  </label>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">theme()</span>
      <span class="event-value">{{ theme() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">status</span>
      <span class="event-value">{{ commit.state.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">intendedValue()</span>
      <span class="event-value">{{ commit.intendedValue() ?? '-' }}</span>
    </div>
  </div>`,
};
