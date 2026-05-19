import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Async commit — pending + error inline glyphs',
  subtitle: 'Bind <code>[commitAction]</code> + <code>[commitMode]</code>. <strong>Pessimistic</strong> keeps the panel open during the commit so the projected <code>*cngxSelectOptionPending</code> glyph is visible inside the option\'s reserved internal slot; <strong>optimistic</strong> closes the panel immediately and rolls back on error. Toggle <strong>Server fails</strong> to observe the failure path: the failed option carries <code>data-status="error"</code> and the projected <code>*cngxSelectOptionError</code> glyph renders — never alongside user content.',
  description: 'CngxSelectShell — single-value declarative-options dropdown. Project user-authored <cngx-option> / <cngx-optgroup> children directly; the shell derives a hierarchy-aware option model and runs the same family-level intelligence (createSelectCore, createFieldSync, createScalarCommitHandler, announcer) as CngxSelect.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelectShell',
    'CngxSelectOption',
    'CngxSelectOptgroup',
    'CngxSelectDivider',
  ],
  moduleImports: [
    'import { CngxSelectShell, CngxSelectOption, CngxSelectOptionError, CngxSelectOptionPending, type CngxSelectCommitAction, type CngxSelectCommitMode } from \'@cngx/forms/select\';',
    'import { delay, of, throwError } from \'rxjs\';',
  ],
  imports: ['CngxSelectShell', 'CngxSelectOption', 'CngxSelectOptionError', 'CngxSelectOptionPending'],
  setup: `protected readonly commitValue = signal<string | undefined>('red');
  protected readonly commitMode = signal<CngxSelectCommitMode>('pessimistic');
  protected readonly commitShouldFail = signal(false);
  protected readonly commitErrors = signal<string[]>([]);
  protected readonly commitAction: CngxSelectCommitAction<string> = (intended) => {
    void intended;
    if (this.commitShouldFail()) {
      return throwError(() => new Error('Server rejected the commit')).pipe(delay(1500));
    }
    return of(intended).pipe(delay(1500));
  };
  protected handleCommitError(err: unknown): void {
    const msg = err instanceof Error ? err.message : String(err);
    this.commitErrors.update((l) => [...l.slice(-4), new Date().toLocaleTimeString() + ' → ' + msg]);
  }`,
  template: `
  <div class="button-row" style="margin-bottom:12px; display:flex; gap:1rem; align-items:center">
    <label style="display:inline-flex; gap:.5rem; align-items:center">
      <span>Mode:</span>
      <select
        [value]="commitMode()"
        (change)="commitMode.set($any($event.target).value)"
        style="padding:.25rem .5rem; border:1px solid var(--cngx-color-border, #cbd5e1); border-radius:.25rem; font: inherit"
      >
        <option value="pessimistic">pessimistic (recommended for visible pending)</option>
        <option value="optimistic">optimistic</option>
      </select>
    </label>
    <label>
      <input
        type="checkbox"
        [checked]="commitShouldFail()"
        (change)="commitShouldFail.set($any($event.target).checked)"
      />
      Server fails next commit
    </label>
  </div>

  <cngx-select-shell
    [label]="'Farbe (committable)'"
    [commitAction]="commitAction"
    [commitMode]="commitMode()"
    [clearable]="true"
    [(value)]="commitValue"
    (commitError)="handleCommitError($event)"
  >
    <ng-template cngxSelectOptionPending>
      <span aria-hidden="true" class="pending-glyph">⏳</span>
    </ng-template>
    <ng-template cngxSelectOptionError>
      <span aria-hidden="true" class="error-glyph">⚠</span>
    </ng-template>
    <cngx-option [value]="'red'">Red</cngx-option>
    <cngx-option [value]="'green'">Green</cngx-option>
    <cngx-option [value]="'blue'">Blue</cngx-option>
  </cngx-select-shell>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">value</span>
      <span class="event-value">{{ commitValue() ?? '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">commitMode</span>
      <span class="event-value">{{ commitMode() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">tip</span>
      <span class="event-value">Pessimistic + click an option → glyph visible for 1.5s</span>
    </div>
    @for (line of commitErrors(); track line) {
      <div class="event-row">
        <span class="event-label">commitError</span>
        <span class="event-value">{{ line }}</span>
      </div>
    }
  </div>`,
  css: `
.pending-glyph {
  display: inline-block;
  animation: cngx-spin 1.2s linear infinite;
}
.error-glyph {
  color: var(--cngx-error, #d32f2f);
  font-size: 1.1em;
}
@keyframes cngx-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
`,
};
