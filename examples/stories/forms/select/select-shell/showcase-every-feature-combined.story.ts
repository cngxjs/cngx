import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Showcase — every feature combined',
  subtitle: 'Reactive ARIA, optgroups, divider, async commit (pessimistic so pending is visible), pending + error glyphs, custom caret, custom placeholder, change-event log, keyboard nav (↑↓/Home/End/PageUp/PageDown, typeahead-while-closed), click-outside dismiss, focus restoration on close.',
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
    'import { CngxSelectShell, CngxSelectOption, CngxSelectOptgroup, CngxSelectDivider, CngxSelectOptionError, CngxSelectOptionPending, CngxSelectPlaceholder, CngxSelectCaret, type CngxSelectCommitAction, type CngxSelectCommitMode, type CngxSelectShellChange } from \'@cngx/forms/select\';',
    'import { delay, of, throwError } from \'rxjs\';',
  ],
  imports: ['CngxSelectShell', 'CngxSelectOption', 'CngxSelectOptgroup', 'CngxSelectDivider', 'CngxSelectOptionPending', 'CngxSelectOptionError', 'CngxSelectPlaceholder', 'CngxSelectCaret'],
  setup: `protected readonly commitMode = signal<CngxSelectCommitMode>('pessimistic');
  protected readonly commitShouldFail = signal(false);
  protected readonly commitAction: CngxSelectCommitAction<string> = (intended) => {
    void intended;
    if (this.commitShouldFail()) {
      return throwError(() => new Error('Server rejected the commit')).pipe(delay(1500));
    }
    return of(intended).pipe(delay(1500));
  };
  protected readonly showcaseValue = signal<string | undefined>('design');
  protected readonly showcaseLog = signal<string[]>([]);
  protected readonly showcaseAction: CngxSelectCommitAction<string> = (intended) => {
    return of(intended).pipe(delay(800));
  };
  protected handleShowcaseChange(e: CngxSelectShellChange<string>): void {
    this.showcaseLog.update((l) =>
      [...l.slice(-4), new Date().toLocaleTimeString() + ' → ' + (e.option?.label ?? 'cleared')],
    );
  }`,
  template: `  <div class="kbd-hint">
    <strong>Try it:</strong>
    <span>focus the trigger and press a letter (typeahead-while-closed)</span>
    <span>open + use <kbd>↑</kbd> <kbd>↓</kbd> <kbd>Home</kbd> <kbd>End</kbd> <kbd>PgUp</kbd> <kbd>PgDn</kbd></span>
    <span><kbd>Enter</kbd> commits · <kbd>Esc</kbd> closes · click outside dismisses</span>
  </div>

  <cngx-select-shell
    [label]="'Department'"
    [commitAction]="showcaseAction"
    [commitMode]="'pessimistic'"
    [clearable]="true"
    [required]="true"
    aria-label="Department picker"
    [(value)]="showcaseValue"
    (selectionChange)="handleShowcaseChange($event)"
  >
    <ng-template cngxSelectPlaceholder>
      <em style="opacity:.6">— pick a department —</em>
    </ng-template>
    <ng-template cngxSelectCaret let-open>
      <span aria-hidden="true" style="display:inline-block; transition: transform .15s; transform: rotate({{ open ? 180 : 0 }}deg)">⌄</span>
    </ng-template>
    <ng-template cngxSelectOptionPending>
      <span aria-hidden="true" class="pending-glyph">⏳</span>
    </ng-template>
    <ng-template cngxSelectOptionError>
      <span aria-hidden="true" class="error-glyph">⚠</span>
    </ng-template>

    <cngx-optgroup label="Product">
      <cngx-option [value]="'design'">Design</cngx-option>
      <cngx-option [value]="'research'">Research</cngx-option>
      <cngx-option [value]="'product'">Product Management</cngx-option>
    </cngx-optgroup>
    <cngx-select-divider />
    <cngx-optgroup label="Engineering">
      <cngx-option [value]="'frontend'">Frontend</cngx-option>
      <cngx-option [value]="'backend'">Backend</cngx-option>
      <cngx-option [value]="'platform'">Platform</cngx-option>
      <cngx-option [value]="'data'" [disabled]="true">Data — frozen requisitions</cngx-option>
    </cngx-optgroup>
    <cngx-select-divider />
    <cngx-optgroup label="Operations">
      <cngx-option [value]="'people'">People Ops</cngx-option>
      <cngx-option [value]="'finance'">Finance</cngx-option>
      <cngx-option [value]="'legal'">Legal</cngx-option>
    </cngx-optgroup>
  </cngx-select-shell>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">value</span>
      <span class="event-value">{{ showcaseValue() ?? '—' }}</span>
    </div>
    @for (line of showcaseLog(); track line) {
      <div class="event-row">
        <span class="event-label">change</span>
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
}
@keyframes cngx-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
`,
};
