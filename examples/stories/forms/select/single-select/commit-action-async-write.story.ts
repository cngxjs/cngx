import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Commit action (async write)',
  subtitle: '<code>[commitAction]</code> defers selection until the async write resolves. <code>[commitMode]="optimistic"</code> closes the panel immediately and rolls back on error; <code>[commitMode]="pessimistic"</code> keeps the panel open with a pending spinner on the picked option and shows an inline banner on error.',
  description: 'CngxSelect — native-feeling single-select dropdown with template overrides, optgroups, clearable, loading, commit-action, and signal-/reactive-forms bridges.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelect',
    'CngxSelectOption',
    'CngxSelectOptgroup',
    'CngxSelectDivider',
    'CngxSelectCheck',
    'CngxSelectCaret',
    'CngxSelectOptgroupTemplate',
    'CngxSelectPlaceholder',
    'CngxSelectEmpty',
    'CngxSelectLoading',
    'CngxSelectLoadingGlyph',
    'CngxSelectRefreshing',
    'CngxSelectCommitError',
    'CngxSelectOptionPending',
    'CngxSelectOptionError',
    'CngxSelectRetryButton',
    'CngxSelectTriggerLabel',
    'CngxSelectOptionLabel',
    'CngxSelectClearButton',
    'provideSelectConfig',
  ],
  moduleImports: [
    'import { CngxSelect, CngxSelectError, type CngxSelectCommitAction, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
    'import { delay, of, throwError } from \'rxjs\';',
  ],
  imports: ['CngxSelect', 'CngxSelectError'],
  setup: `protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
    { value: 'disabled', label: 'Unavailable', disabled: true },
  ];
  protected readonly commitValue = signal<string | undefined>('red');
  protected readonly commitMode = signal<'optimistic' | 'pessimistic'>('optimistic');
  protected readonly commitShouldFail = signal(false);
  protected readonly commitLog = signal<string[]>([]);
  protected readonly commitAction: CngxSelectCommitAction<string> = (intended) => {
    const ts = new Date().toLocaleTimeString();
    this.commitLog.update(l => [...l, ts + ' → commit(' + String(intended) + ')']);
    if (this.commitShouldFail()) {
      return throwError(() => new Error('Server offline')).pipe(delay(800));
    }
    return of(intended).pipe(delay(800));
  };`,
  template: `  <cngx-select
    [label]="'Farbe (commit)'"
    [options]="colors"
    [commitAction]="commitAction"
    [commitMode]="commitMode()"
    [(value)]="commitValue"
  />`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ commitValue() ?? '—' }}</span></div>
    <div class="event-row" style="gap:8px;align-items:center">
      <label style="display:inline-flex;align-items:center;gap:4px">
        <input type="radio" name="commit-mode" value="optimistic" [checked]="commitMode() === 'optimistic'" (change)="commitMode.set('optimistic')" /> optimistic
      </label>
      <label style="display:inline-flex;align-items:center;gap:4px">
        <input type="radio" name="commit-mode" value="pessimistic" [checked]="commitMode() === 'pessimistic'" (change)="commitMode.set('pessimistic')" /> pessimistic
      </label>
      <label style="display:inline-flex;align-items:center;gap:4px">
        <input type="checkbox" [checked]="commitShouldFail()" (change)="commitShouldFail.set($any($event.target).checked)" /> simulate error
      </label>
    </div>
    <div class="event-row">
      <span class="event-label">Log</span>
      <span class="event-value" style="font-family:monospace;font-size:0.75rem">
        @for (line of commitLog(); track line; let i = $index) {
          <div>{{ line }}</div>
        }
      </span>
    </div>
  </div>`,
};
