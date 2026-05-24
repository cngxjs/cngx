import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionSelect: async error rollback observation',
  subtitle: 'Quick-create routes through an Observable with 600ms delay. Toggle the <strong>Server fails</strong> checkbox to make the next create reject - the error surfaces via <code>(commitError)</code>, the commit-error banner renders above the options, and the value stays untouched (pessimistic flow).',
  description: 'CngxActionSelect - single-value autocomplete with inline quick-create. Seventh sibling of the select family; thin organism on top of createSelectCore + createCreateCommitHandler.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxActionSelect',
    'CngxSelectAction',
  ],
  moduleImports: [
    'import { CngxActionSelect, type CngxSelectCreateAction, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
    'import { CngxSelectAction } from \'@cngx/forms/select\';',
    'import { delay, of, throwError } from \'rxjs\';',
  ],
  imports: ['CngxActionSelect', 'CngxSelectAction'],
  setup: `protected readonly tags: CngxSelectOptionDef<{ id: string; name: string }>[] = [
    { value: { id: 't1', name: 'Design' }, label: 'Design' },
    { value: { id: 't2', name: 'Development' }, label: 'Development' },
    { value: { id: 't3', name: 'QA' }, label: 'QA' },
    { value: { id: 't4', name: 'Docs' }, label: 'Docs' },
  ];
  protected readonly basicCompare = (
    a: { id: string; name: string } | undefined,
    b: { id: string; name: string } | undefined,
  ) => (a?.id ?? null) === (b?.id ?? null);
  protected readonly basicDisplay = (v: { id: string; name: string }) => v.name;
  protected readonly asyncValue = signal<{ id: string; name: string } | undefined>(undefined);
  protected readonly asyncShouldFail = signal(false);
  protected readonly asyncLog = signal<string[]>([]);
  protected asyncCounter = 0;
  protected readonly asyncCreate: CngxSelectCreateAction<{ id: string; name: string }> =
    (_term, draft) => {
      if (this.asyncShouldFail()) {
        return throwError(() => new Error('Server rejected "' + draft.label + '"')).pipe(delay(600));
      }
      return of({ id: 'srv-' + ++this.asyncCounter, name: draft.label }).pipe(delay(600));
    };
  protected handleAsyncError(err: unknown): void {
    const msg = err instanceof Error ? err.message : String(err);
    this.asyncLog.update((l) => [...l.slice(-4), new Date().toLocaleTimeString() + ' → ' + msg]);
  }`,
  template: `  <cngx-action-select
    [label]="'Async Tag'"
    [options]="tags"
    [compareWith]="basicCompare"
    [displayWith]="basicDisplay"
    [quickCreateAction]="asyncCreate"
    [clearable]="true"
    [(value)]="asyncValue"
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
        @if (pending) { ⏳ Creating "{{ term }}"… }
        @else { + Create "{{ term || '…' }}" }
      </button>
    </ng-template>
  </cngx-action-select>`,
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
      <span class="event-label">Selected</span>
      <span class="event-value">{{ asyncValue()?.name ?? '—' }}</span>
    </div>
    @for (line of asyncLog(); track line) {
      <div class="event-row">
        <span class="event-label">error</span>
        <span class="event-value">{{ line }}</span>
      </div>
    }
  </div>`,
};
