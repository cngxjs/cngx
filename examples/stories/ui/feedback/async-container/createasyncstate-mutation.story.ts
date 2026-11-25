import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncContainer: createAsyncState mutation',
  subtitle: 'For POST/PUT/DELETE. Uses <code>execute(fn)</code> which sets status to <code>pending</code>. Tick the fail switch to see the error branch.',
  description: 'Mutation factory variant: <code>createAsyncState()</code> exposes <code>execute(fn)</code> for write paths. The chrome readout exposes <code>status</code>, <code>isPending</code>, <code>data</code> and <code>error</code> live, so the success/error branches are observable without UI templating. The Save button reflects the state through <code>[cngxAsyncStatus]</code> with <code>[disableWhilePending]</code>: it gets <code>aria-disabled</code> instead of <code>disabled</code>, so a keyboard user keeps focus on it, and <code>[cngxToastOn]</code> announces the outcome.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'error-handling', 'composition'],
  apiComponents: ['createAsyncState', 'CngxAsyncStatus', 'CngxToastOn'],
  moduleImports: [
    "import { createAsyncState } from '@cngx/common/data';",
    "import { CngxAsyncStatus } from '@cngx/common/interactive';",
    "import { CngxToastOn } from '@cngx/ui/feedback';",
    "import { failDemoActionWhen } from '../../../../fixtures';",
  ],
  imports: ['CngxAsyncStatus', 'CngxToastOn'],
  setup: `protected readonly saveAction = createAsyncState<string>();
  private readonly save = (): Promise<string> =>
    new Promise((resolve) => setTimeout(() => resolve('OK'), 1500));
  protected handleSave(): void {
    void this.saveAction.execute(() => this.save());
  }`,
  setupChrome: `  protected readonly failNext = signal(false);
  // Makes save fail while the switch below is on.
  private readonly failSwitch = failDemoActionWhen(
    this,
    'save',
    () => this.failNext(),
    () => new Error('Server error'),
  );`,
  template: `  <div class="demo-inline-actions" style="margin-bottom:16px">
    <button
      (click)="handleSave()"
      class="chip"
      type="button"
      [cngxAsyncStatus]="saveAction"
      [disableWhilePending]="true"
      [cngxToastOn]="saveAction"
      toastSuccess="Saved"
      toastError="Save failed"
    >
      {{ saveAction.isPending() ? 'Saving...' : 'Save' }}
    </button>
    <button (click)="saveAction.reset()" class="chip" type="button">Reset</button>
  </div>`,
  templateChrome: `<label class="event-row" style="gap:6px;align-items:center">
    <input type="checkbox" [checked]="failNext()" (change)="failNext.set($any($event.target).checked)" />
    <span>Fail next save</span>
  </label>
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">Status</span>
      <span class="event-value">{{ saveAction.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">isPending</span>
      <span class="event-value">{{ saveAction.isPending() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Data</span>
      <span class="event-value">{{ saveAction.data() ?? '-' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Error</span>
      <span class="event-value">{{ saveAction.error() ?? '-' }}</span>
    </div>
  </div>`,
};
