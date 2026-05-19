import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'commitErrorDisplay variants — banner / inline / none',
  subtitle: 'Three identical selects bound to the same fail-on-demand <code>commitAction</code> with the three <code>commitErrorDisplay</code> values side by side. Toggle <em>Fail next</em>, click a value, and watch how each display mode surfaces the rejection.',
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
    'import { CngxSelect, type CngxSelectCommitAction, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
    'import { delay, of, throwError } from \'rxjs\';',
  ],
  imports: ['CngxSelect'],
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
  template: `  <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:1rem">
    <div>
      <h4 style="margin:0 0 0.5rem 0;font-size:0.85rem">banner</h4>
      <cngx-select
        [label]="'Color'"
        [options]="colors"
        [(value)]="commitValue"
        [commitAction]="commitAction"
        [commitMode]="'optimistic'"
        commitErrorDisplay="banner"
      />
      <small style="display:block;margin-top:6px;color:var(--cngx-color-text-muted)">Default. Inline alert above the option list.</small>
    </div>
    <div>
      <h4 style="margin:0 0 0.5rem 0;font-size:0.85rem">inline</h4>
      <cngx-select
        [label]="'Color'"
        [options]="colors"
        [(value)]="commitValue"
        [commitAction]="commitAction"
        [commitMode]="'optimistic'"
        commitErrorDisplay="inline"
      />
      <small style="display:block;margin-top:6px;color:var(--cngx-color-text-muted)">Per-row visual badge on the failing option (AT feedback via the announcer).</small>
    </div>
    <div>
      <h4 style="margin:0 0 0.5rem 0;font-size:0.85rem">none</h4>
      <cngx-select
        [label]="'Color'"
        [options]="colors"
        [(value)]="commitValue"
        [commitAction]="commitAction"
        [commitMode]="'optimistic'"
        commitErrorDisplay="none"
      />
      <small style="display:block;margin-top:6px;color:var(--cngx-color-text-muted)">No built-in UI — bridge via <code>&lt;cngx-toast-on /&gt;</code> or other transition bridges.</small>
    </div>
  </div>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="commitShouldFail.set(!commitShouldFail())">
      {{ commitShouldFail() ? 'Fail next: ON' : 'Fail next: off' }}
    </button>
  </div>`,
};
