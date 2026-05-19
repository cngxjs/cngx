import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Async + error — rollback observation',
  subtitle: 'Quick-create routes through an Observable with 500ms delay. Toggle <strong>Server fails</strong> to trigger an error — <code>(commitError)</code> fires, the values array stays untouched (pessimistic), the commit-error banner surfaces above the options.',
  description: 'CngxActionMultiSelect — multi-value combobox with inline quick-create. Eighth sibling of the select family; reuses createCreateCommitHandler with a dedicated commit controller so toggle/create lifecycles stay independent.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants', 'a11y-pattern'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxActionMultiSelect',
    'CngxSelectAction',
    'provideActionSelectConfig',
  ],
  moduleImports: [
    'import { CngxActionMultiSelect, type CngxSelectCreateAction, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
    'import { CngxSelectAction } from \'@cngx/forms/select\';',
    'import { delay, of, throwError } from \'rxjs\';',
  ],
  imports: ['CngxActionMultiSelect', 'CngxSelectAction'],
  setup: `protected readonly tags: CngxSelectOptionDef<{ id: string; name: string }>[] = [
    { value: { id: 't1', name: 'Design' }, label: 'Design' },
    { value: { id: 't2', name: 'Development' }, label: 'Development' },
    { value: { id: 't3', name: 'QA' }, label: 'QA' },
    { value: { id: 't4', name: 'Docs' }, label: 'Docs' },
    { value: { id: 't5', name: 'Review' }, label: 'Review' },
  ];
  protected readonly basicCompare = (
    a: { id: string; name: string } | undefined,
    b: { id: string; name: string } | undefined,
  ) => (a?.id ?? null) === (b?.id ?? null);
  protected readonly asyncValues = signal<{ id: string; name: string }[]>([]);
  protected readonly asyncShouldFail = signal(false);
  protected readonly asyncLog = signal<string[]>([]);
  protected asyncCounter = 0;
  protected readonly asyncCreate: CngxSelectCreateAction<{ id: string; name: string }> =
    (_term, draft) => {
      if (this.asyncShouldFail()) {
        return throwError(() => new Error('Server rejected "' + draft.label + '"')).pipe(delay(500));
      }
      return of({ id: 'srv-' + ++this.asyncCounter, name: draft.label }).pipe(delay(500));
    };
  protected handleAsyncError(err: unknown): void {
    const msg = err instanceof Error ? err.message : String(err);
    this.asyncLog.update((l) => [...l.slice(-4), new Date().toLocaleTimeString() + ' → ' + msg]);
  }`,
  template: `  <cngx-action-multi-select
    [label]="'Async Tags'"
    [options]="tags"
    [compareWith]="basicCompare"
    [quickCreateAction]="asyncCreate"
    [clearable]="true"
    [(values)]="asyncValues"
    (commitError)="handleAsyncError($event)"
  >
    <ng-template
      cngxSelectAction
      let-term
      let-commit="commit"
      let-pending="isPending"
    >
      <button
        type="button"
        [disabled]="!term || pending"
        (click)="commit()"
        style="
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 0;
          border-top: 1px solid var(--cngx-color-border, #e5e7eb);
          background: transparent;
          text-align: left;
          cursor: pointer;
          font: inherit;
        "
      >
        @if (pending) { ⏳ „{{ term }}" wird angelegt… }
        @else { + Create "{{ term || '…' }}" }
      </button>
    </ng-template>
  </cngx-action-multi-select>`,
  templateChrome: `<div class="button-row" style="margin-bottom:12px">
    <label>
      <input
        type="checkbox"
        [checked]="asyncShouldFail()"
        (change)="asyncShouldFail.set($any($event.target).checked)"
      />
      Server fails
    </label>
  </div>
<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Values</span>
      <span class="event-value">{{ asyncValues().map(v => v.name).join(', ') || '—' }}</span>
    </div>
    @for (line of asyncLog(); track line) {
      <div class="event-row">
        <span class="event-label">error</span>
        <span class="event-value">{{ line }}</span>
      </div>
    }
  </div>`,
};
