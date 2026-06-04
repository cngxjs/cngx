import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: slot overrides cngxselectoptionpending cngxselectoptionerror',
  subtitle: 'Per-option-row indicators driven by <code>[commitAction]</code>. Pending shows while the commit is in flight; the error glyph appears on the row that failed (with <code>commitErrorDisplay="inline"</code>).',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelect',
    'CngxSelectOptionPending',
    'CngxSelectOptionError',
  ],
  moduleImports: [
    'import { CngxSelect, CngxSelectOptionPending, CngxSelectOptionError, type CngxSelectCommitAction, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
    'import { delay, of, throwError } from \'rxjs\';',
  ],
  imports: ['CngxSelect', 'CngxSelectOptionPending', 'CngxSelectOptionError'],
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
    commitErrorDisplay="inline"
  >
    <ng-template cngxSelectOptionPending let-opt>
      <span aria-hidden="true" class="demo-select-option-status demo-select-option-status--pending">⏳</span>
    </ng-template>
    <ng-template cngxSelectOptionError let-opt let-error="error">
      <span aria-hidden="true" [title]="error?.message" class="demo-select-option-status demo-select-option-status--error">✕</span>
    </ng-template>
  </cngx-select>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="commitShouldFail.set(!commitShouldFail())">
      {{ commitShouldFail() ? 'Fail next: ON' : 'Fail next: off' }}
    </button>
    <button type="button" class="chip" (click)="commitMode.set(commitMode() === 'optimistic' ? 'pessimistic' : 'optimistic')">
      Mode: {{ commitMode() }}
    </button>
  </div>`,
};
