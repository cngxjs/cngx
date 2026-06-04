import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: commiterrordisplay variants banner inline none',
  subtitle: 'Three identical selects bound to the same fail-on-demand <code>commitAction</code> with the three <code>commitErrorDisplay</code> values side by side. Toggle <em>Fail next</em>, click a value, and watch how each display mode surfaces the rejection.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelect',
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
      <h4 class="demo-variant-heading">banner</h4>
      <cngx-select
        [label]="'Color'"
        [options]="colors"
        [(value)]="commitValue"
        [commitAction]="commitAction"
        [commitMode]="'optimistic'"
        commitErrorDisplay="banner"
      />
      <small class="demo-variant-caption">Default. Inline alert above the option list.</small>
    </div>
    <div>
      <h4 class="demo-variant-heading">inline</h4>
      <cngx-select
        [label]="'Color'"
        [options]="colors"
        [(value)]="commitValue"
        [commitAction]="commitAction"
        [commitMode]="'optimistic'"
        commitErrorDisplay="inline"
      />
      <small class="demo-variant-caption">Per-row visual badge on the failing option (AT feedback via the announcer).</small>
    </div>
    <div>
      <h4 class="demo-variant-heading">none</h4>
      <cngx-select
        [label]="'Color'"
        [options]="colors"
        [(value)]="commitValue"
        [commitAction]="commitAction"
        [commitMode]="'optimistic'"
        commitErrorDisplay="none"
      />
      <small class="demo-variant-caption">No built-in UI - bridge via <code>&lt;cngx-toast-on /&gt;</code> or other transition bridges.</small>
    </div>
  </div>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="commitShouldFail.set(!commitShouldFail())">
      {{ commitShouldFail() ? 'Fail next: ON' : 'Fail next: off' }}
    </button>
  </div>`,
};
