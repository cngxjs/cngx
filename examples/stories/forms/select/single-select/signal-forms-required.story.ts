import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Signal Forms (required)',
  subtitle: 'Drop <code>&lt;cngx-select&gt;</code> into <code>&lt;cngx-form-field&gt;</code>. Everything flows automatically.',
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
    'import { form, schema, required, submit } from \'@angular/forms/signals\';',
    'import { CngxFormField, CngxLabel, CngxFieldErrors } from \'@cngx/forms/field\';',
    'import { CngxSelect, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxSelect'],
  setup: `protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
    { value: 'disabled', label: 'Unavailable', disabled: true },
  ];
  private readonly singleModel = signal<{ color: string }>({ color: '' });
  private readonly singleSchema = schema<{ color: string }>((root) => {
    required(root.color);
  });
  protected readonly singleForm = form(this.singleModel, this.singleSchema);
  protected handleSingleSubmit(): void {
    submit(this.singleForm, async () => []);
  }`,
  template: `
  <cngx-form-field [field]="singleForm.color">
    <label cngxLabel>Lieblingsfarbe</label>
    <cngx-select [label]="'Lieblingsfarbe'" [options]="colors" placeholder="Pick a color…" />
    <cngx-field-errors />
  </cngx-form-field>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Field value</span><span class="event-value">{{ singleForm.color().value() || '—' }}</span></div>
    <div class="event-row"><span class="event-label">Valid</span><span class="event-value">{{ singleForm.color().valid() ? 'yes' : 'no' }}</span></div>
    <div class="event-row"><span class="event-label">Touched</span><span class="event-value">{{ singleForm.color().touched() ? 'yes' : 'no' }}</span></div>
    <div class="event-row" style="margin-top:8px">
      <button type="button" class="chip" (click)="handleSingleSubmit()">Submit</button>
    </div>
  </div>`,
};
