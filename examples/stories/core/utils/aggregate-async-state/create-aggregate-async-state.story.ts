import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'createAggregateAsyncState: create aggregate async state',
  subtitle:
    '<code>createAggregateAsyncState(sources)</code> folds N independent <code>CngxAsyncState</code>s into one derived <code>CngxAsyncState</code>. It is pure and needs no injection context; the result binds to <code>cngx-async-container</code> like any other state.',
  description:
    'Combined status, first match wins: any <code>error</code> gives <code>error</code>; else any <code>loading</code> or <code>pending</code> gives <code>loading</code>; else any <code>refreshing</code> gives <code>refreshing</code>; else all <code>success</code> gives <code>success</code>; otherwise <code>idle</code>. <code>data</code> is the per-source data in input order, <code>error</code> is the first error in input order, <code>isEmpty</code> holds only when every source is empty, <code>isFirstLoad</code> when any source has not loaded yet, and <code>lastUpdated</code> is the newest source timestamp. Pending collapses into loading, so <code>isPending</code> is always <code>false</code>, and <code>progress</code> is always <code>undefined</code>. Drive each source independently and watch the aggregate readout.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['async-state', 'composition', 'error-handling'],
  apiComponents: ['CngxAsyncContainer'],
  moduleImports: [
    "import { createAggregateAsyncState } from '@cngx/core/utils';",
    "import { createManualState, type ManualAsyncState } from '@cngx/common/data';",
    "import { CngxAsyncContainer, CngxAsyncSkeletonTpl, CngxAsyncContentTpl, CngxAsyncEmptyTpl, CngxAsyncErrorTpl } from '@cngx/ui/feedback';",
  ],
  imports: [
    'CngxAsyncContainer',
    'CngxAsyncSkeletonTpl',
    'CngxAsyncContentTpl',
    'CngxAsyncEmptyTpl',
    'CngxAsyncErrorTpl',
  ],
  setup: `protected readonly orders = createManualState<string[]>();
  protected readonly invoices = createManualState<string[]>();
  protected readonly messages = createManualState<string[]>();

  protected readonly inbox = createAggregateAsyncState<string[]>(
    computed(() => [this.orders, this.invoices, this.messages]),
  );`,
  template: `  <cngx-async-container [state]="inbox" ariaLabel="Inbox overview">
    <ng-template cngxAsyncSkeleton>
      <div class="demo-skeleton-line"></div>
    </ng-template>
    <ng-template cngxAsyncContent let-data>
      <ul class="demo-stack demo-stack--tight demo-loading-config-list">
        <li>Orders: {{ data[0]?.length ?? 0 }}</li>
        <li>Invoices: {{ data[1]?.length ?? 0 }}</li>
        <li>Messages: {{ data[2]?.length ?? 0 }}</li>
      </ul>
    </ng-template>
    <ng-template cngxAsyncEmpty>
      <p class="demo-empty-state-block">Nothing in the inbox.</p>
    </ng-template>
    <ng-template cngxAsyncError let-err>
      <p class="demo-error-block">{{ err }}</p>
    </ng-template>
  </cngx-async-container>`,
  setupChrome: `protected readonly modes = ['idle', 'loading', 'pending', 'refreshing', 'success', 'empty', 'error'] as const;

  protected readonly sources: readonly { key: string; label: string; state: ManualAsyncState<string[]>; sample: string[] }[] = [
    { key: 'orders', label: 'Orders', state: this.orders, sample: ['#1041', '#1042', '#1043'] },
    { key: 'invoices', label: 'Invoices', state: this.invoices, sample: ['INV-7', 'INV-8'] },
    { key: 'messages', label: 'Messages', state: this.messages, sample: ['Welcome'] },
  ];

  protected readonly failures = computed(() =>
    this.sources
      .filter((s) => s.state.status() === 'error')
      .map((s) => s.label + ': ' + s.state.error()),
  );

  constructor() {
    for (const s of this.sources) {
      s.state.setSuccess(s.sample);
    }
  }

  protected modeOf(state: ManualAsyncState<string[]>): string {
    const status = state.status();
    return status === 'success' && state.isEmpty() ? 'empty' : status;
  }

  protected apply(source: { label: string; state: ManualAsyncState<string[]>; sample: string[] }, mode: string): void {
    switch (mode) {
      case 'idle':
        source.state.reset();
        break;
      case 'success':
        source.state.setSuccess(source.sample);
        break;
      case 'empty':
        source.state.setSuccess([]);
        break;
      case 'error':
        source.state.setError(source.label + ' failed: 503 Service Unavailable');
        break;
      default:
        source.state.set(mode as 'loading' | 'pending' | 'refreshing');
    }
  }

  protected formatTime(date: Date | undefined): string {
    return date ? date.toLocaleTimeString() : 'undefined';
  }`,
  templateChromeBefore: `@for (s of sources; track s.key) {
    <fieldset class="demo-strategy-picker">
      <legend>{{ s.label }} source</legend>
      @for (m of modes; track m) {
        <label>
          <input type="radio" [name]="'aggregate-source-' + s.key" [checked]="modeOf(s.state) === m" (change)="apply(s, m)" />
          {{ m }}
        </label>
      }
    </fieldset>
  }`,
  templateChrome: `<div class="event-grid">
    <div class="event-row">
      <span class="event-label">inbox.status()</span>
      <span class="event-value">{{ inbox.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">isBusy() / isLoading()</span>
      <span class="event-value">{{ inbox.isBusy() }} / {{ inbox.isLoading() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">isRefreshing() / isPending()</span>
      <span class="event-value">{{ inbox.isRefreshing() }} / {{ inbox.isPending() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">isFirstLoad() / isSettled()</span>
      <span class="event-value">{{ inbox.isFirstLoad() }} / {{ inbox.isSettled() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">isEmpty() / hasData()</span>
      <span class="event-value">{{ inbox.isEmpty() }} / {{ inbox.hasData() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">data() lengths</span>
      <span class="event-value">[{{ inbox.data()[0]?.length ?? 'undefined' }}, {{ inbox.data()[1]?.length ?? 'undefined' }}, {{ inbox.data()[2]?.length ?? 'undefined' }}]</span>
    </div>
    <div class="event-row">
      <span class="event-label">error() (first)</span>
      <span class="event-value">{{ inbox.error() ?? 'undefined' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">all failing sources</span>
      <span class="event-value">{{ failures().length ? failures().join('; ') : 'none' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">progress()</span>
      <span class="event-value">{{ inbox.progress() ?? 'undefined' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">lastUpdated()</span>
      <span class="event-value">{{ formatTime(inbox.lastUpdated()) }}</span>
    </div>
  </div>`,
};
