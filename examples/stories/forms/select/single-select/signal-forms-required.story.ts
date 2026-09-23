import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: signal forms required',
  subtitle: 'Drop <code>&lt;cngx-select&gt;</code> into <code>&lt;cngx-form-field&gt;</code>. Everything flows automatically.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxSelect',
  ],
  moduleImports: [
    'import { CngxRadioGroup, CngxRadio } from \'@cngx/common/interactive\';',
    'import type { CngxFieldSkin } from \'@cngx/forms/field\';',
    'import { form, schema, required, submit } from \'@angular/forms/signals\';',
    'import { CngxFormField, CngxLabel, CngxFieldErrors } from \'@cngx/forms/field\';',
    'import { CngxSelect, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxSelect', 'CngxRadioGroup', 'CngxRadio'],
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
  protected readonly skin = signal<CngxFieldSkin>('outline');`,
  setupChrome: `  protected handleSingleSubmit(): void {
    submit(this.singleForm, async () => []);
  }`,
  template: `  <cngx-form-field [field]="singleForm.color" [skin]="skin()">
    <label cngxLabel>Favorite color</label>
    <cngx-select [label]="'Favorite color'" [options]="colors" placeholder="Pick a color…" />
    <cngx-field-errors />
  </cngx-form-field>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Field value</span><span class="event-value">{{ singleForm.color().value() || '—' }}</span></div>
    <div class="event-row"><span class="event-label">Valid</span><span class="event-value">{{ singleForm.color().valid() ? 'yes' : 'no' }}</span></div>
    <div class="event-row"><span class="event-label">Touched</span><span class="event-value">{{ singleForm.color().touched() ? 'yes' : 'no' }}</span></div>
    <div class="event-row" style="margin-top:8px">
      <button type="button" class="chip" (click)="handleSingleSubmit()">Submit</button>
    </div>
    <div class="event-row" style="margin-top:8px">
      <cngx-radio-group [(value)]="skin" name="field-skin" label="Field skin">
        <cngx-radio value="outline">Outline</cngx-radio>
        <cngx-radio value="fill">Fill</cngx-radio>
        <cngx-radio value="bare">Bare</cngx-radio>
      </cngx-radio-group>
    </div>
  </div>`,
};
