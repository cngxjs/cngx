import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Typeahead — async [state] (load + error + retry)',
  subtitle: 'Typeahead with <code>[state]</code> driving the panel view. Trigger <em>Load</em> / <em>Error</em> / <em>Reset</em> to step through the async-view machine — first-load skeleton, error banner with retry, refresh shimmer.',
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
    'import { CngxTypeahead, type CngxSelectOptionDef, type CngxSelectOptionsInput } from \'@cngx/forms/select\';',
    'import { createManualState, type ManualAsyncState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxTypeahead'],
  setup: `  protected readonly typeaheadUsers: CngxSelectOptionDef<{ id: number; name: string }>[] = [
    { value: { id: 1, name: 'Alice Meier' },  label: 'Alice Meier' },
    { value: { id: 2, name: 'Bob Schmidt' },  label: 'Bob Schmidt' },
    { value: { id: 3, name: 'Charlotte Fischer' }, label: 'Charlotte Fischer' },
    { value: { id: 4, name: 'David Weber' }, label: 'David Weber' },
    { value: { id: 5, name: 'Eva Wagner' }, label: 'Eva Wagner' },
  ];
  protected readonly typeaheadCompare = (a: { id: number } | undefined, b: { id: number } | undefined): boolean =>
    (a?.id ?? NaN) === (b?.id ?? NaN);
  protected readonly typeaheadDisplay = (u: { id: number; name: string }): string => u.name;
  protected readonly typeaheadAsyncState: ManualAsyncState<CngxSelectOptionsInput<{ id: number; name: string }>> =
    createManualState<CngxSelectOptionsInput<{ id: number; name: string }>>();
  protected readonly typeaheadAsyncValue = signal<{ id: number; name: string } | undefined>(undefined);`,
  setupChrome: `protected readonly loading = signal(true);
  protected typeaheadAsyncSetLoading(): void { this.typeaheadAsyncState.set('loading'); }
  protected typeaheadAsyncSetSuccess(): void { this.typeaheadAsyncState.setSuccess(this.typeaheadUsers); }
  protected typeaheadAsyncSetError(): void { this.typeaheadAsyncState.setError(new Error('Network offline')); }`,
  template: `  <cngx-typeahead
    [label]="'User'"
    [options]="typeaheadUsers"
    [compareWith]="typeaheadCompare"
    [displayWith]="typeaheadDisplay"
    [state]="typeaheadAsyncState"
    [clearable]="true"
    placeholder="Search by name…"
    [(value)]="typeaheadAsyncValue"
  />`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="typeaheadAsyncSetLoading()">Set loading</button>
    <button type="button" class="chip" (click)="typeaheadAsyncSetSuccess()">Set success</button>
    <button type="button" class="chip" (click)="typeaheadAsyncSetError()">Set error</button>
  </div>`,
};
