import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMultiSelect: multi async options via state',
  subtitle: 'Same async-state protocol as the single variant. The panel renders skeleton / empty / error / refreshing states from the bound <code>CngxAsyncState</code>; the trigger chip list stays derived from the resolved data.',
  description: 'CngxMultiSelect - multi-value selection with a chip strip trigger. Same async/commit machinery as CngxSelect; multi-specific slot overrides for chip + summary templates.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxMultiSelect',
  ],
  moduleImports: [
    'import { CngxMultiSelect, type CngxSelectOptionDef, type CngxSelectOptionsInput } from \'@cngx/forms/select\';',
    'import { createManualState, type ManualAsyncState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxMultiSelect'],
  setup: `  protected readonly multiAsyncValues = signal<string[]>([]);
  protected readonly multiAsyncState: ManualAsyncState<CngxSelectOptionsInput<string>> =
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
  protected multiAsyncSetLoading(): void { this.multiAsyncState.set('loading'); }
  protected multiAsyncSetSuccess(): void { this.multiAsyncState.setSuccess(this.tagOptions); }`,
  template: `  <cngx-multi-select
    [label]="'Topics'"
    [state]="multiAsyncState"
    [(values)]="multiAsyncValues"
    placeholder="Choose topics…"
  />`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row" style="margin-top:8px">
      <button type="button" class="chip" (click)="multiAsyncSetLoading()">Set loading</button>
      <button type="button" class="chip" (click)="multiAsyncSetSuccess()">Set success</button>
    </div>
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ multiAsyncValues().join(', ') || '—' }}</span></div>
    <div class="event-row"><span class="event-label">State status</span><span class="event-value">{{ multiAsyncState.status() }}</span></div>
  </div>`,
};
