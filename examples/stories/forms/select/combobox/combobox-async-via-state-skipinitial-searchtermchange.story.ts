import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCombobox: combobox async via state skipinitial searchtermchange',
  subtitle: 'Async-option wiring for server-driven autocomplete. <code>[skipInitial]="true"</code> suppresses the hydrate-time empty-string emission so your request handler never fires a "load everything" on mount. <code>(searchTermChange)</code> bridges the debounced term to your backend; <code>[state]</code> feeds the returned options back into the panel with the full async-view protocol (loading/empty/error/refreshing).',
  description: 'CngxCombobox - tag-input filter with live typeahead. Multi-value tag strip + free-text filtering, plus the same async/commit machinery as CngxSelect.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxCombobox',
  ],
  moduleImports: [
    'import { CngxCombobox, type CngxSelectOptionDef, type CngxSelectOptionsInput } from \'@cngx/forms/select\';',
    'import { createManualState, type ManualAsyncState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxCombobox'],
  setup: `  protected readonly comboLastTerm = signal<string>('');
  protected readonly comboAsyncValues = signal<string[]>([]);
  protected readonly comboAsyncState: ManualAsyncState<CngxSelectOptionsInput<string>> =
    createManualState<CngxSelectOptionsInput<string>>();`,
  setupChrome: `protected readonly loading = signal(true);
  protected readonly tagOptions: CngxSelectOptionDef<string>[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'signals', label: 'Signals' },
    { value: 'rxjs', label: 'RxJS' },
    { value: 'a11y', label: 'Accessibility' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'old', label: 'Unmaintained', disabled: true },
  ];
  protected comboAsyncSetLoading(): void { this.comboAsyncState.set('loading'); }
  protected comboAsyncSetSuccess(): void {
    this.comboAsyncState.setSuccess(this.tagOptions);
  }`,
  template: `  <cngx-combobox
    [label]="'Topics'"
    [state]="comboAsyncState"
    [(values)]="comboAsyncValues"
    [skipInitial]="true"
    (searchTermChange)="comboLastTerm.set($event)"
    placeholder="Search topics…"
  />`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row" style="margin-top:8px">
      <button type="button" class="chip" (click)="comboAsyncSetLoading()">Set loading</button>
      <button type="button" class="chip" (click)="comboAsyncSetSuccess()">Set success</button>
    </div>
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ comboAsyncValues().join(', ') || '—' }}</span></div>
    <div class="event-row"><span class="event-label">State status</span><span class="event-value">{{ comboAsyncState.status() }}</span></div>
    <div class="event-row"><span class="event-label">Last term</span><span class="event-value">{{ comboLastTerm() || '—' }}</span></div>
  </div>`,
};
