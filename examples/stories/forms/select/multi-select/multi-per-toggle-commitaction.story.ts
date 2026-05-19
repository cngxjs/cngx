import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Multi — per-toggle [commitAction]',
  subtitle: 'Each toggle routes through an async write. <code>optimistic</code> (default) updates <code>values()</code> immediately and rolls back on error; <code>pessimistic</code> defers the write until success and surfaces a spinner on the toggled option. Consecutive toggles supersede any in-flight commit.',
  description: 'CngxMultiSelect — multi-value selection with a chip strip trigger. Same async/commit machinery as CngxSelect; multi-specific slot overrides for chip + summary templates.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxMultiSelect',
    'CngxMultiSelectChip',
    'CngxMultiSelectTriggerLabel',
  ],
  moduleImports: [
    'import { CngxMultiSelect, type CngxSelectCommitAction, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
    'import { delay, of, throwError } from \'rxjs\';',
  ],
  imports: ['CngxMultiSelect'],
  setup: `protected readonly commitMode = signal<'optimistic' | 'pessimistic'>('optimistic');
  protected readonly commitShouldFail = signal(false);
  protected readonly commitLog = signal<string[]>([]);
  protected readonly commitAction: CngxSelectCommitAction<string> = (intended) => {
    const ts = new Date().toLocaleTimeString();
    this.commitLog.update(l => [...l, ts + ' → commit(' + String(intended) + ')']);
    if (this.commitShouldFail()) {
      return throwError(() => new Error('Server offline')).pipe(delay(800));
    }
    return of(intended).pipe(delay(800));
  };
  protected readonly tagOptions: CngxSelectOptionDef<string>[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'signals', label: 'Signals' },
    { value: 'rxjs', label: 'RxJS' },
    { value: 'a11y', label: 'Accessibility' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'old', label: 'Nicht mehr gepflegt', disabled: true },
  ];
  protected readonly multiCommitValues = signal<string[]>(['angular']);
  protected readonly multiCommitMode = signal<'optimistic' | 'pessimistic'>('optimistic');
  protected readonly multiCommitShouldFail = signal(false);
  protected readonly multiCommitLog = signal<string[]>([]);
  protected readonly multiCommitAction: CngxSelectCommitAction<string[]> = (intended) => {
    const ts = new Date().toLocaleTimeString();
    this.multiCommitLog.update(l => [...l, ts + ' → commit([' + (intended ?? []).join(',') + '])']);
    if (this.multiCommitShouldFail()) {
      return throwError(() => new Error('Server offline')).pipe(delay(800));
    }
    return of(intended).pipe(delay(800));
  };`,
  template: `  <cngx-multi-select
    [label]="'Topics (commit)'"
    [options]="tagOptions"
    [(values)]="multiCommitValues"
    [commitAction]="multiCommitAction"
    [commitMode]="multiCommitMode()"
    placeholder="Choose topics…"
  />`,
  templateChrome: `<div class="event-row" style="gap:8px;align-items:center;margin-bottom:8px">
    <button type="button" class="chip"
            [style.background]="multiCommitMode() === 'optimistic' ? 'color-mix(in oklch, var(--cngx-color-success) 18%, transparent)' : ''"
            (click)="multiCommitMode.set('optimistic')">optimistic</button>
    <button type="button" class="chip"
            [style.background]="multiCommitMode() === 'pessimistic' ? 'color-mix(in oklch, var(--cngx-color-success) 18%, transparent)' : ''"
            (click)="multiCommitMode.set('pessimistic')">pessimistic</button>
    <label style="margin-inline-start:12px">
      <input type="checkbox"
             [checked]="multiCommitShouldFail()"
             (change)="multiCommitShouldFail.set($any($event.target).checked)" />
      simulate error
    </label>
  </div>
<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ multiCommitValues().join(', ') || '—' }}</span></div>
    <div class="event-row"><span class="event-label">Commit log</span>
      <span class="event-value" style="white-space:pre">{{ multiCommitLog().slice(-4).join('\\n') || '—' }}</span>
    </div>
  </div>`,
};
