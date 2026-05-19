import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Typeahead — [commitAction] with optimistic/pessimistic mode',
  subtitle: 'Same commit machinery as CngxSelect. Pick a user — the action runs for 800ms. Toggle mode to compare panel-close timing (optimistic closes immediately + rolls back on error; pessimistic keeps panel open until success). Fail-next button forces the action into the error path.',
  description: 'CngxTypeahead — scalar async autocomplete. Single-value input bound to an async option source with typed-form-field, commit-action and slot-override support.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxTypeahead',
    'CngxSelectOptionLabel',
  ],
  moduleImports: [
    'import { CngxTypeahead, type CngxSelectCommitAction, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
    'import { delay, of, throwError } from \'rxjs\';',
  ],
  imports: ['CngxTypeahead'],
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
  protected readonly typeaheadUsers: CngxSelectOptionDef<{ id: number; name: string }>[] = [
    { value: { id: 1, name: 'Alice Meier' },  label: 'Alice Meier' },
    { value: { id: 2, name: 'Bob Schmidt' },  label: 'Bob Schmidt' },
    { value: { id: 3, name: 'Charlotte Fischer' }, label: 'Charlotte Fischer' },
    { value: { id: 4, name: 'David Weber' }, label: 'David Weber' },
    { value: { id: 5, name: 'Eva Wagner' }, label: 'Eva Wagner' },
  ];
  protected readonly typeaheadCompare = (a: { id: number } | undefined, b: { id: number } | undefined): boolean =>
    (a?.id ?? NaN) === (b?.id ?? NaN);
  protected readonly typeaheadDisplay = (u: { id: number; name: string }): string => u.name;
  protected readonly typeaheadCommitValue = signal<{ id: number; name: string } | undefined>(undefined);
  protected readonly typeaheadCommitMode = signal<'optimistic' | 'pessimistic'>('optimistic');
  protected readonly typeaheadCommitShouldFail = signal(false);
  protected readonly typeaheadCommitLog = signal<string[]>([]);
  protected readonly typeaheadCommitAction: CngxSelectCommitAction<{ id: number; name: string }> = (intended) => {
    const ts = new Date().toLocaleTimeString();
    this.typeaheadCommitLog.update(l => [...l, ts + ' → commit(' + (intended?.name ?? 'undefined') + ')']);
    if (this.typeaheadCommitShouldFail()) {
      return throwError(() => new Error('Server offline')).pipe(delay(800));
    }
    return of(intended).pipe(delay(800));
  };`,
  template: `  <cngx-typeahead
    [label]="'User'"
    [options]="typeaheadUsers"
    [compareWith]="typeaheadCompare"
    [displayWith]="typeaheadDisplay"
    [commitAction]="typeaheadCommitAction"
    [commitMode]="typeaheadCommitMode()"
    [(value)]="typeaheadCommitValue"
    placeholder="Search by name…"
  />`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="typeaheadCommitMode.set(typeaheadCommitMode() === 'optimistic' ? 'pessimistic' : 'optimistic')">
      Mode: {{ typeaheadCommitMode() }}
    </button>
    <button type="button" class="chip" (click)="typeaheadCommitShouldFail.set(!typeaheadCommitShouldFail())">
      {{ typeaheadCommitShouldFail() ? 'Fail next: ON' : 'Fail next: off' }}
    </button>
  </div>
<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ typeaheadCommitValue()?.name ?? '—' }}</span></div>
    <div class="event-row"><span class="event-label">Log</span><span class="event-value">{{ typeaheadCommitLog().slice(-3).join(' · ') || '—' }}</span></div>
  </div>`,
};
