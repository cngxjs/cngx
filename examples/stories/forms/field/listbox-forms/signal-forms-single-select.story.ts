import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Signal Forms — single select',
  subtitle: 'Two-way binding via <code>[(value)]="singleForm.color().value"</code>. Required validation shown when touched.',
  description: 'CngxListbox integrated into <cngx-form-field> via CngxListboxFieldBridge, plus the universal CngxBindField bridge for any other control (mat-select, native inputs, custom controls).',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['integration', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxListboxFieldBridge',
    'CngxBindField',
    'CngxListbox',
    'CngxOption',
    'CngxFormField',
  ],
  moduleImports: [
    'import { form, schema, required, submit } from \'@angular/forms/signals\';',
    'import { CngxFormField, CngxLabel, CngxFieldErrors, CngxListboxFieldBridge } from \'@cngx/forms/field\';',
    'import { CngxListbox, CngxOption } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxFormField', 'CngxLabel', 'CngxFieldErrors', 'CngxListbox', 'CngxOption', 'CngxListboxFieldBridge'],
  setup: `private readonly singleModel = signal<{ color: string }>({ color: '' });
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
    <div cngxListbox
         cngxListboxFieldBridge
         [label]="'Lieblingsfarbe'"
         tabindex="0">
      <div cngxOption value="red">Red</div>
      <div cngxOption value="green">Green</div>
      <div cngxOption value="blue">Blue</div>
    </div>
    <cngx-field-errors />
  </cngx-form-field>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Field value</span>
      <span class="event-value">{{ singleForm.color().value() || '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Valid</span>
      <span class="event-value">{{ singleForm.color().valid() ? 'yes' : 'no' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Touched</span>
      <span class="event-value">{{ singleForm.color().touched() ? 'yes' : 'no' }}</span>
    </div>
    <div class="event-row" style="margin-top:8px">
      <button type="button" class="chip" (click)="handleSingleSubmit()">Submit</button>
    </div>
  </div>`,
};
