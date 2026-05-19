import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'createAsyncState — Mutation',
  subtitle: 'For POST/PUT/DELETE. Uses <code>execute(fn)</code> which sets status to <code>pending</code>. 70% chance of success, 30% error.',
  description: 'Coordinates skeleton, content, empty, error, refresh, and toast from a single CngxAsyncState. Three factory functions, two template APIs, composable with other feedback atoms.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'error-handling', 'composition'],
  apiComponents: [
    'CngxAsyncContainer',
    'CngxAsync',
  ],
  moduleImports: [
    'import { CngxAsync, createAsyncState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxAsync'],
  setup: `protected readonly saveAction = createAsyncState<string>();
  protected handleSave(): void {
    void this.saveAction.execute(() =>
      new Promise<string>((resolve, reject) => {
        setTimeout(() => Math.random() > 0.3 ? resolve('OK') : reject(new Error('Server error')), 1500);
      })
    );
  }`,
  template: `  <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px">
    <button (click)="handleSave()" class="chip" [disabled]="saveAction.isPending()">
      {{ saveAction.isPending() ? 'Saving...' : 'Save (70% success)' }}
    </button>
    <button (click)="saveAction.reset()" class="chip">Reset</button>
  </div>`,
  templateChrome: `<div class="event-grid">
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
      <span class="event-value">{{ saveAction.data() ?? '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Error</span>
      <span class="event-value">{{ saveAction.error() ?? '—' }}</span>
    </div>
  </div>`,
};
