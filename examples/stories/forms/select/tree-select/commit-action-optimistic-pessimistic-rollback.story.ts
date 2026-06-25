import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreeSelect: commit action optimistic pessimistic rollback',
  subtitle:
    'Every toggle routes through an async write. <code>optimistic</code> updates <code>values()</code> immediately and rolls back on error; <code>pessimistic</code> defers the write until success. Flip <strong>simulate error</strong> to watch the optimistic write revert.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['behavior', 'composition'],
  framework: 'signal-forms',
  apiComponents: ['CngxTreeSelect'],
  moduleImports: [
    "import { CngxTreeSelect, type CngxSelectCommitAction } from '@cngx/forms/select';",
    "import type { CngxTreeNode } from '@cngx/utils';",
    "import { delay, of, throwError } from 'rxjs';",
  ],
  imports: ['CngxTreeSelect'],
  setup: `protected readonly nodes: CngxTreeNode<string>[] = [
    {
      value: 'frontend',
      label: 'Frontend',
      children: [
        { value: 'angular', label: 'Angular' },
        { value: 'signals', label: 'Signals' },
        { value: 'rxjs', label: 'RxJS' },
      ],
    },
    {
      value: 'backend',
      label: 'Backend',
      children: [
        { value: 'node', label: 'Node' },
        { value: 'postgres', label: 'Postgres' },
      ],
    },
  ];
  protected readonly values = signal<string[]>(['angular']);
  protected readonly nodeId = (value: string) => value;
  protected readonly commitMode = signal<'optimistic' | 'pessimistic'>('optimistic');
  protected readonly commitShouldFail = signal(false);
  protected readonly commitLog = signal<string[]>([]);
  protected readonly commitAction: CngxSelectCommitAction<string[]> = (intended) => {
    const ts = new Date().toLocaleTimeString();
    this.commitLog.update((l) => [...l, ts + ' → commit([' + (intended ?? []).join(',') + '])']);
    if (this.commitShouldFail()) {
      return throwError(() => new Error('Server offline')).pipe(delay(800));
    }
    return of(intended).pipe(delay(800));
  };`,
  template: `  <cngx-tree-select
    [label]="'Tech stack'"
    [nodes]="nodes"
    [(values)]="values"
    [nodeIdFn]="nodeId"
    [cascadeChildren]="true"
    [initiallyExpanded]="'all'"
    [commitAction]="commitAction"
    [commitMode]="commitMode()"
    placeholder="Pick technologies…"
  />`,
  templateChrome: `<div class="event-row" style="gap:8px;align-items:center;margin-bottom:8px">
    <button type="button" class="chip"
            [style.background]="commitMode() === 'optimistic' ? 'color-mix(in oklch, var(--cngx-color-success) 18%, transparent)' : ''"
            (click)="commitMode.set('optimistic')">optimistic</button>
    <button type="button" class="chip"
            [style.background]="commitMode() === 'pessimistic' ? 'color-mix(in oklch, var(--cngx-color-success) 18%, transparent)' : ''"
            (click)="commitMode.set('pessimistic')">pessimistic</button>
    <label style="margin-inline-start:12px">
      <input type="checkbox"
             [checked]="commitShouldFail()"
             (change)="commitShouldFail.set($any($event.target).checked)" />
      simulate error
    </label>
  </div>
<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">values</span>
      <span class="event-value">{{ values().join(', ') || '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Commit log</span>
      <span class="event-value" style="white-space:pre">{{ commitLog().slice(-4).join('\\n') || '—' }}</span>
    </div>
  </div>`,
};
