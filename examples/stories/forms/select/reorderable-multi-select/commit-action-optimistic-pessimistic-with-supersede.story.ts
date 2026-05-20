import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Commit action — optimistic / pessimistic with supersede',
  subtitle: 'Each reorder hits the commit action. Optimistic applies immediately and rolls back on error; pessimistic freezes the whole strip until the write succeeds. Consecutive reorders supersede any in-flight commit — the state machine is shared with the rest of the select family.',
  description: 'CngxReorderableMultiSelect — multi-value picker whose selected chips can be reordered via pointer drag and Alt+Arrow keyboard moves. Thin organism on top of createSelectCore + CngxReorder.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'behavior', 'a11y-pattern'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxReorderableMultiSelect',
    'CngxReorder',
    'CngxMultiSelectChip',
    'CngxMultiSelectTriggerLabel',
  ],
  moduleImports: [
    'import { CngxReorderableMultiSelect, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
    'import { delay, of, throwError } from \'rxjs\';',
  ],
  imports: ['CngxReorderableMultiSelect'],
  setup: `protected readonly songs: CngxSelectOptionDef<string>[] = [
    { value: 's1', label: 'Intro — Mogwai' },
    { value: 's2', label: 'Heart-Shaped Box — Nirvana' },
    { value: 's3', label: 'Midnight City — M83' },
    { value: 's4', label: 'Teardrop — Massive Attack' },
    { value: 's5', label: 'Breathe — Pink Floyd' },
    { value: 's6', label: 'Paranoid Android — Radiohead' },
  ];
  protected readonly commitValues = signal<string[]>(['s1', 's2', 's3', 's4', 's5']);
  protected readonly commitMode = signal<'optimistic' | 'pessimistic'>('optimistic');
  protected readonly commitShouldFail = signal(false);
  protected readonly commitLog = signal<string[]>([]);
  protected readonly commitErrors = signal<string[]>([]);
  protected readonly commitAction = (intended: string[] | undefined) => {
    const ts = new Date().toLocaleTimeString();
    const line = ts + ' → [' + (intended ?? []).join(', ') + ']';
    this.commitLog.update((l) => [...l.slice(-4), line]);
    if (this.commitShouldFail()) {
      return throwError(() => new Error('Save failed (demo)')).pipe(delay(700));
    }
    return of(intended).pipe(delay(700));
  };
  protected handleCommitError(err: unknown): void {
    const ts = new Date().toLocaleTimeString();
    const msg = err instanceof Error ? err.message : String(err);
    this.commitErrors.update((l) => [...l.slice(-4), ts + ' → ' + msg]);
  }`,
  template: `  <cngx-reorderable-multi-select
    [label]="'Playlist'"
    [options]="songs"
    [clearable]="true"
    [commitAction]="commitAction"
    [commitMode]="commitMode()"
    [(values)]="commitValues"
    (commitError)="handleCommitError($event)"
  />`,
  templateChrome: `<div class="button-row" style="margin-bottom:12px">
    <label>
      <input
        type="radio"
        name="rm-commitMode"
        value="optimistic"
        [checked]="commitMode() === 'optimistic'"
        (change)="commitMode.set('optimistic')"
      />
      Optimistic
    </label>
    <label>
      <input
        type="radio"
        name="rm-commitMode"
        value="pessimistic"
        [checked]="commitMode() === 'pessimistic'"
        (change)="commitMode.set('pessimistic')"
      />
      Pessimistic
    </label>
    <label style="margin-left:1rem">
      <input
        type="checkbox"
        [checked]="commitShouldFail()"
        (change)="commitShouldFail.set($any($event.target).checked)"
      />
      Server fails
    </label>
  </div>
<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Playlist order</span>
      <span class="event-value">{{ commitValues().join(' → ') || '—' }}</span>
    </div>
    @for (line of commitLog(); track line) {
      <div class="event-row">
        <span class="event-label">commit</span>
        <span class="event-value">{{ line }}</span>
      </div>
    }
    @for (line of commitErrors(); track line) {
      <div class="event-row">
        <span class="event-label">error</span>
        <span class="event-value">{{ line }}</span>
      </div>
    }
  </div>`,
};
