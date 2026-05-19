import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Slot override: *cngxSelectCommitError',
  subtitle: 'Replace the panel-shell\'s default commit-error banner with custom markup. Override receives <code>error</code>, the <code>option</code> the user was trying to pick, and a <code>retry()</code> callback that replays the commit.',
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
    'import { CngxSelect, CngxSelectCommitError, type CngxSelectCommitAction, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
    'import { delay, of, throwError } from \'rxjs\';',
  ],
  imports: ['CngxSelect', 'CngxSelectCommitError'],
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
    [label]="'Color'"
    [options]="colors"
    [(value)]="commitValue"
    [commitAction]="commitAction"
    [commitMode]="commitMode()"
    commitErrorDisplay="banner"
  >
    <ng-template cngxSelectCommitError let-error let-option="option" let-retry="retry">
      <div role="alert" style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem;background:color-mix(in oklch, var(--cngx-color-danger) 10%, transparent);color:var(--cngx-color-danger);border-radius:6px">
        <span aria-hidden="true">⚠</span>
        <span style="flex:1">Could not save <strong>{{ option?.label }}</strong>: {{ error?.message }}</span>
        <button type="button" class="chip" (click)="retry()">Replay</button>
      </div>
    </ng-template>
  </cngx-select>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="commitShouldFail.set(!commitShouldFail())">
      {{ commitShouldFail() ? 'Fail next: ON' : 'Fail next: off' }}
    </button>
  </div>`,
};
